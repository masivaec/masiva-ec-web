#!/usr/bin/env python3
"""
Construye el sitio estático de masiva.ec.

  src/partials/cabecera.html  -> cabecera única
  src/partials/pie.html       -> pie único
  src/pages/<slug>.html       -> contenido de cada página con front-matter (title, description, path...)

Salida: /index.html y /<slug>/index.html en la raíz del repo, listos para desplegar.
Uso: python3 build.py
"""
import os, re, json, html, glob, datetime

RAIZ = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(RAIZ, "src")
DOMINIO = "https://masiva.ec"
STAGING = True  # True = noindex en todas las páginas (quitar al pasar a producción)

cabecera = open(os.path.join(SRC, "partials", "cabecera.html"), encoding="utf-8").read()
pie = open(os.path.join(SRC, "partials", "pie.html"), encoding="utf-8").read()

PLANTILLA = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
{robots}<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_EC">
<meta property="og:site_name" content="MASIVA">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{dominio}/assets/img/og-masiva.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#262626">
<link rel="icon" href="/assets/img/logo/masiva-icono-naranja.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/sora-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/styles.css">
<!-- Google Tag Manager: pegar aquí el contenedor cuando esté listo (carga diferida) -->
{jsonld}</head>
<body class="{body_class}">

<a class="visualmente-oculto" href="#contenido">Ir al contenido</a>

{cabecera}
<main id="contenido">
{contenido}
</main>

{pie}
<script src="/assets/js/main.js" defer></script>
{extra_js}
</body>
</html>
"""

ORG = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MASIVA-EC S.A.",
    "alternateName": "MASIVA",
    "url": DOMINIO + "/",
    "logo": DOMINIO + "/assets/img/logo/masiva-vertical-naranja.svg",
    "slogan": "¡conecta, comunica, triunfa!",
    "contactPoint": [{
        "@type": "ContactPoint", "telephone": "+593994488880", "email": "soporte@masiva.ec",
        "contactType": "sales", "areaServed": "EC", "availableLanguage": "es"}],
    "sameAs": ["https://www.facebook.com/MasivaEc", "https://www.instagram.com/masivaec"],
}


def front_matter(texto):
    m = re.match(r"^---\n(.*?)\n---\n", texto, re.S)
    meta = {}
    if m:
        for linea in m.group(1).splitlines():
            if ":" in linea:
                k, v = linea.split(":", 1)
                meta[k.strip()] = v.strip()
        texto = texto[m.end():]
    return meta, texto


def jsonld_para(meta):
    bloques = [ORG]
    if meta.get("path", "/") != "/":
        bloques.append({
            "@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Inicio", "item": DOMINIO + "/"},
                {"@type": "ListItem", "position": 2, "name": meta.get("h1", meta["title"].split("|")[0].strip()),
                 "item": DOMINIO + meta["path"]}]})
    if meta.get("servicio"):
        bloques.append({
            "@context": "https://schema.org", "@type": "Service",
            "name": meta["servicio"], "provider": {"@type": "Organization", "name": "MASIVA-EC S.A."},
            "areaServed": "EC", "url": DOMINIO + meta["path"], "description": meta["description"]})
    if meta.get("faq_json"):
        bloques.append(json.loads(meta["faq_json"]))
    return "".join('<script type="application/ld+json">\n' + json.dumps(b, ensure_ascii=False, indent=1) + "\n</script>\n" for b in bloques)


def marcar_activo(cab, path):
    # resalta el ítem de menú de la página actual
    if path == "/":
        return cab.replace('<li><a href="/">Inicio</a>', '<li><a href="/" aria-current="page">Inicio</a>')
    return re.sub(r'<a href="%s">' % re.escape(path), '<a href="%s" aria-current="page">' % path, cab, count=1)


salidas = []
for ruta in sorted(glob.glob(os.path.join(SRC, "pages", "*.html"))):
    meta, contenido = front_matter(open(ruta, encoding="utf-8").read())
    path = meta.get("path", "/" + os.path.basename(ruta)[:-5] + "/")
    canonical = DOMINIO + path
    robots = '<meta name="robots" content="noindex, nofollow">\n' if STAGING or meta.get("noindex") == "true" else ""
    pagina = PLANTILLA.format(
        title=html.escape(meta["title"]), description=html.escape(meta["description"]),
        og_title=html.escape(meta.get("og_title", meta["title"])), canonical=canonical, dominio=DOMINIO,
        robots=robots, jsonld=jsonld_para(meta), body_class=meta.get("body_class", ""),
        cabecera=marcar_activo(cabecera, path), contenido=contenido.strip("\n"), pie=pie.strip("\n"),
        extra_js='<script src="/assets/js/red.js" defer></script>' if path == "/" else "")
    pagina = pagina.replace("{{anio}}", str(datetime.date.today().year))
    destino = os.path.join(RAIZ, "index.html") if path == "/" else os.path.join(RAIZ, path.strip("/"), "index.html")
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    open(destino, "w", encoding="utf-8").write(pagina)
    salidas.append(path)

# 404 (sin canonical ni índice)
if os.path.exists(os.path.join(SRC, "pages_extra", "404.html")):
    meta, contenido = front_matter(open(os.path.join(SRC, "pages_extra", "404.html"), encoding="utf-8").read())
    pagina = PLANTILLA.format(
        title="Página no encontrada | MASIVA", description="La página que buscas no existe o cambió de lugar.",
        og_title="Página no encontrada", canonical=DOMINIO + "/", dominio=DOMINIO,
        robots='<meta name="robots" content="noindex">\n', jsonld="", body_class="",
        cabecera=cabecera, contenido=contenido, pie=pie, extra_js="")
    open(os.path.join(RAIZ, "404.html"), "w", encoding="utf-8").write(pagina)

# .cpanel.yml con todo lo publicable
dirs = sorted({p.strip("/").split("/")[0] for p in salidas if p != "/"})
items = ["index.html", "404.html", "assets"] + dirs
for extra in ("robots.txt", "sitemap.xml", ".htaccess", "LEEME-ESTRUCTURA.txt"):
    if os.path.exists(os.path.join(RAIZ, extra)):
        items.append(extra)
yml = "---\ndeployment:\n  tasks:\n    - export DEPLOYPATH=/home/mamascloud/nuevo.masiva.ec/\n"
for it in items:
    yml += "    - /bin/cp -R %s $DEPLOYPATH\n" % it
open(os.path.join(RAIZ, ".cpanel.yml"), "w").write(yml)

# deploy.sh: lo ejecuta el cron de cPanel después de git pull (mismo contenido que .cpanel.yml)
sh = "#!/bin/bash\n# Generado por build.py. Copia el sitio al subdominio. No editar a mano.\n"
sh += "DEPLOYPATH=/home/mamascloud/nuevo.masiva.ec/\n"
sh += 'cd "$(dirname "$0")" || exit 1\n'
for it in items:
    sh += "/bin/cp -R %s $DEPLOYPATH\n" % it
open(os.path.join(RAIZ, "deploy.sh"), "w").write(sh)

print("Páginas generadas:", len(salidas))
for p in salidas:
    print("  ", p)
