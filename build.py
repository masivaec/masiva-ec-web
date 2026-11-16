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
STAGING = True  # True = sitio de prueba (noindex). False = producción.
DEPLOYPATH = "/home/mamascloud/nuevo.masiva.ec/" if STAGING else "/home/mamascloud/public_html/"

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
<meta property="og:image" content="{og_image}">
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
        extra_js='<script src="/assets/js/red.js" defer></script>' if path == "/" else "",
        og_image=DOMINIO + "/assets/img/og-masiva.png")
    pagina = pagina.replace("{{anio}}", str(datetime.date.today().year))
    destino = os.path.join(RAIZ, "index.html") if path == "/" else os.path.join(RAIZ, path.strip("/"), "index.html")
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    open(destino, "w", encoding="utf-8").write(pagina)
    salidas.append(path)


# ============================================================== BLOG
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
def fecha_larga(iso):
    a, m, d = iso.split("-")
    return "%d de %s de %s" % (int(d), MESES[int(m) - 1], a)

blog_cfg = json.load(open(os.path.join(SRC, "blog-config.json"), encoding="utf-8")) if os.path.exists(os.path.join(SRC, "blog-config.json")) else None
articulos = []
if blog_cfg:
    CATS, CTA = blog_cfg["categorias"], blog_cfg["cta"]
    for ruta in glob.glob(os.path.join(SRC, "blog", "*.html")):
        meta, cuerpo = front_matter(open(ruta, encoding="utf-8").read())
        meta["cuerpo"] = cuerpo
        articulos.append(meta)
    articulos.sort(key=lambda m: m["fecha"], reverse=True)
    # el índice empieza por mensajería (el fuerte de MASIVA), luego el resto por fecha
    articulos.sort(key=lambda m: 0 if m["categoria"] == "mensajeria" else 1)

    def tarjeta(m, h="h3"):
        img = m["portada"].replace(".webp", "-600.webp")
        return ('<article class="post-tarjeta" data-cat="%s"><a href="%s">'
                '<div class="post-img"><img src="%s" alt="" width="600" height="315" loading="lazy" decoding="async"></div>'
                '<div class="post-info"><span class="chip">%s</span><%s>%s</%s><p>%s</p><span class="post-min">%s min de lectura</span></div>'
                '</a></article>') % (m["categoria"], m["path"], img, CATS[m["categoria"]], h, html.escape(m["titulo"]), h,
                                     html.escape(m["description"]), m["minutos"])

    for m in articulos:
        path = m["path"]; cat = m["categoria"]
        cta = CTA[cat]
        relacionados = [r for r in articulos if r["categoria"] == cat and r is not m][:3]
        if len(relacionados) < 3:
            relacionados += [r for r in articulos if r is not m and r not in relacionados][:3 - len(relacionados)]
        contenido = """<article class="post">
<section class="hero-pagina sencillo post-hero">
  <div class="contenedor">
    <nav class="migas" aria-label="Ruta"><a href="/">Inicio</a><span><a href="/blog/">Blog</a></span><span><a href="/blog/#%(cat)s">%(catn)s</a></span></nav>
    <h1>%(titulo)s</h1>
    <p class="post-meta"><time datetime="%(fecha)s">%(fechal)s</time><span>%(min)s min de lectura</span></p>
  </div>
</section>
<div class="contenedor post-portada"><img src="%(img)s" alt="%(titulo)s" width="%(w)s" height="%(h)s" fetchpriority="high"></div>
<section class="seccion post-seccion">
  <div class="contenedor post-grid">
    <div class="prosa post-cuerpo">
%(cuerpo)s
    </div>
    <aside class="post-lateral">
      <div class="post-cta">
        <h2>%(cta_t)s</h2>
        <p>%(cta_p)s</p>
        <a class="btn btn-primario" href="%(cta_u)s">%(cta_b)s</a>
        <a class="enlace" href="https://wa.me/593994488880?text=Hola%%20MASIVA%%2C%%20le%%C3%%AD%%20su%%20blog%%20y%%20quiero%%20informaci%%C3%%B3n" target="_blank" rel="noopener">o escríbenos por WhatsApp</a>
      </div>
    </aside>
  </div>
</section>
</article>
<section class="seccion oscuro">
  <div class="contenedor">
    <div class="seccion-cab"><h2>Sigue leyendo</h2></div>
    <div class="post-lista">%(rel)s</div>
  </div>
</section>""" % dict(cat=cat, catn=CATS[cat], titulo=html.escape(m["titulo"]), fecha=m["fecha"], fechal=fecha_larga(m["fecha"]),
                    min=m["minutos"], img=m["portada"], w=m["portada_w"], h=m["portada_h"], cuerpo=m["cuerpo"].strip(),
                    cta_t=cta[0], cta_p=cta[1], cta_u=cta[2], cta_b=cta[3], rel="".join(tarjeta(r) for r in relacionados))
        art_ld = {"@context": "https://schema.org", "@type": "BlogPosting", "headline": m["titulo"], "description": m["description"],
                  "image": DOMINIO + m["portada"], "datePublished": m["fecha"], "dateModified": m.get("modificado", m["fecha"]),
                  "mainEntityOfPage": DOMINIO + path, "inLanguage": "es-EC",
                  "author": {"@type": "Organization", "name": "MASIVA", "url": DOMINIO + "/"},
                  "publisher": {"@type": "Organization", "name": "MASIVA-EC S.A.", "logo": {"@type": "ImageObject", "url": DOMINIO + "/assets/img/logo/masiva-vertical-naranja.svg"}}}
        migas_ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Inicio", "item": DOMINIO + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": DOMINIO + "/blog/"},
            {"@type": "ListItem", "position": 3, "name": m["titulo"], "item": DOMINIO + path}]}
        jsonld = "".join('<script type="application/ld+json">\n' + json.dumps(b, ensure_ascii=False) + "\n</script>\n" for b in (art_ld, migas_ld))
        robots = '<meta name="robots" content="noindex, nofollow">\n' if STAGING else ""
        pagina = PLANTILLA.format(title=html.escape(m["title"]), description=html.escape(m["description"]),
                                  og_title=html.escape(m["titulo"]), canonical=DOMINIO + path, dominio=DOMINIO, robots=robots,
                                  jsonld=jsonld, body_class="pagina-post", cabecera=marcar_activo(cabecera, "/blog/"),
                                  contenido=contenido, pie=pie.strip("\n"), extra_js="", og_image=DOMINIO + m["portada"])
        pagina = pagina.replace("{{anio}}", str(datetime.date.today().year)).replace('og:type" content="website"', 'og:type" content="article"')
        destino = os.path.join(RAIZ, path.strip("/"), "index.html")
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        open(destino, "w", encoding="utf-8").write(pagina)
        salidas.append(path)

    # índice /blog/
    chips = '<button type="button" class="filtro" data-filtro="todos" aria-pressed="true">Todos <small>%d</small></button>' % len(articulos)
    for k, v in CATS.items():
        n = sum(1 for a in articulos if a["categoria"] == k)
        chips += '<button type="button" class="filtro" data-filtro="%s" aria-pressed="false">%s <small>%d</small></button>' % (k, v, n)
    contenido = """<section class="hero-pagina sencillo">
  <div class="contenedor hero-pagina-int"><div>
    <nav class="migas" aria-label="Ruta"><a href="/">Inicio</a><span>Blog</span></nav>
    <h1>Blog de comunicación, tecnología y marketing</h1>
    <p class="lead">Guías y ideas sobre WhatsApp, SMS, email, inteligencia artificial y marketing para empresas que se comunican con miles de personas.</p>
  </div></div>
</section>
<section class="seccion">
  <div class="contenedor">
    <div class="filtros" role="group" aria-label="Filtrar por categoría">%s</div>
    <div class="post-lista" id="lista-blog">%s</div>
  </div>
</section>""" % (chips, "".join(tarjeta(a, "h2") for a in articulos))
    robots = '<meta name="robots" content="noindex, nofollow">\n' if STAGING else ""
    lista_ld = {"@context": "https://schema.org", "@type": "Blog", "name": "Blog de MASIVA", "url": DOMINIO + "/blog/",
                "blogPost": [{"@type": "BlogPosting", "headline": a["titulo"], "url": DOMINIO + a["path"]} for a in articulos[:20]]}
    pagina = PLANTILLA.format(title="Blog de comunicación, tecnología y marketing | MASIVA",
                              description="Guías sobre WhatsApp Business API, SMS, email, chatbots, inteligencia artificial y marketing para empresas en Ecuador.",
                              og_title="Blog de MASIVA", canonical=DOMINIO + "/blog/", dominio=DOMINIO, robots=robots,
                              jsonld='<script type="application/ld+json">\n' + json.dumps(lista_ld, ensure_ascii=False) + "\n</script>\n",
                              body_class="", cabecera=marcar_activo(cabecera, "/blog/"), contenido=contenido, pie=pie.strip("\n"),
                              extra_js="", og_image=DOMINIO + "/assets/img/og-masiva.png")
    pagina = pagina.replace("{{anio}}", str(datetime.date.today().year))
    os.makedirs(os.path.join(RAIZ, "blog"), exist_ok=True)
    open(os.path.join(RAIZ, "blog", "index.html"), "w", encoding="utf-8").write(pagina)
    salidas.append("/blog/")

# 404 (sin canonical ni índice)
if os.path.exists(os.path.join(SRC, "pages_extra", "404.html")):
    meta, contenido = front_matter(open(os.path.join(SRC, "pages_extra", "404.html"), encoding="utf-8").read())
    pagina = PLANTILLA.format(
        title="Página no encontrada | MASIVA", description="La página que buscas no existe o cambió de lugar.",
        og_title="Página no encontrada", canonical=DOMINIO + "/", dominio=DOMINIO,
        robots='<meta name="robots" content="noindex">\n', jsonld="", body_class="",
        cabecera=cabecera, contenido=contenido, pie=pie, extra_js="", og_image=DOMINIO + "/assets/img/og-masiva.png")
    open(os.path.join(RAIZ, "404.html"), "w", encoding="utf-8").write(pagina)


# ============================================================== robots, sitemap, .htaccess
hoy = datetime.date.today().isoformat()
if STAGING:
    robots_txt = "# Sitio de prueba: no indexar\nUser-agent: *\nDisallow: /\n"
else:
    robots_txt = "User-agent: *\nDisallow: /wclientes/\nDisallow: /area-de-clientes/\nDisallow: /whois/\n\nSitemap: %s/sitemap.xml\n" % DOMINIO
open(os.path.join(RAIZ, "robots.txt"), "w").write(robots_txt)

NO_SITEMAP = {"/area-de-clientes/", "/whois/"}
fechas = {a["path"]: a.get("modificado", a["fecha"]) for a in articulos}
sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for pth in sorted(set(salidas)):
    if pth in NO_SITEMAP: continue
    sm += "  <url><loc>%s%s</loc><lastmod>%s</lastmod></url>\n" % (DOMINIO, pth, fechas.get(pth, hoy))
sm += "</urlset>\n"
open(os.path.join(RAIZ, "sitemap.xml"), "w").write(sm)

REDIRECCIONES = {  # URLs del sitio anterior -> nuevas
    "contactenos": "/contacto/", "home": "/", "chat-bot": "/chatbots-agentes-ia/", "omnicanalidad": "/chatbots-agentes-ia/",
    "whatsapp-marketing-whatsapp-masivo-bulk": "/whatsapp/", "sms-mensajes-de-texto-masivos": "/sms/",
    "informacion-sms": "/sms/", "pagina-calculadora": "/sms/", "correos-electronicos-emails-masivos-mailing": "/email/",
}
if blog_cfg:
    for slug, destino in blog_cfg["descartados"]:
        REDIRECCIONES[slug] = destino
ht = """# masiva.ec - generado por build.py (no editar a mano en el servidor)
# El bloque de PHP de cPanel (handler) se conserva aparte: ver htaccess-cpanel.txt

DirectoryIndex index.html index.php
Options -Indexes
ErrorDocument 404 /404.html

<IfModule mod_rewrite.c>
RewriteEngine On

# 1) WHMCS y validaciones SSL: no se tocan
RewriteRule ^wclientes(/|$) - [L]
RewriteRule ^\\.well-known/ - [L]

# 2) HTTPS siempre y sin www
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
RewriteCond %{HTTP_HOST} ^www\\.masiva\\.ec$ [NC]
RewriteRule ^ https://masiva.ec%{REQUEST_URI} [R=301,L]

# 3) URLs del sitio anterior
"""
for viejo, nuevo in sorted(REDIRECCIONES.items()):
    ht += "RewriteRule ^%s/?$ %s [R=301,L]\n" % (re.escape(viejo).replace("\\-", "-"), nuevo)
ht += """RewriteRule ^(category|tag|author)/ /blog/ [R=301,L]
RewriteRule ^(feed|comments/feed)/?$ /blog/ [R=301,L]
RewriteRule ^wp-(login|signup|activate|cron|trackback|comments-post)\\.php$ - [G,L]
RewriteRule ^xmlrpc\\.php$ - [G,L]
RewriteRule ^wp-(admin|includes|content|json)(/|$) - [G,L]
</IfModule>

# Caché del navegador
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType image/webp "access plus 1 year"
ExpiresByType image/svg+xml "access plus 1 year"
ExpiresByType image/png "access plus 1 year"
ExpiresByType image/jpeg "access plus 1 year"
ExpiresByType font/woff2 "access plus 1 year"
ExpiresByType text/css "access plus 7 days"
ExpiresByType application/javascript "access plus 7 days"
ExpiresByType text/javascript "access plus 7 days"
</IfModule>

# Compresión
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css application/javascript text/javascript image/svg+xml application/json text/xml application/xml
</IfModule>

# Seguridad básica
<IfModule mod_headers.c>
Header set X-Content-Type-Options "nosniff"
Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
"""
extra_ht = os.path.join(RAIZ, "src", "htaccess-cpanel.txt")
if os.path.exists(extra_ht):
    ht += "\n" + open(extra_ht).read()
open(os.path.join(RAIZ, ".htaccess"), "w").write(ht)

# .cpanel.yml con todo lo publicable
dirs = sorted({p.strip("/").split("/")[0] for p in salidas if p != "/"})
items = ["index.html", "404.html", "assets"] + dirs
for extra in ("robots.txt", "sitemap.xml", ".htaccess", "LEEME-ESTRUCTURA.txt"):
    if os.path.exists(os.path.join(RAIZ, extra)):
        items.append(extra)
yml = "---\ndeployment:\n  tasks:\n    - export DEPLOYPATH=%s\n" % DEPLOYPATH
for it in items:
    yml += "    - /bin/cp -R %s $DEPLOYPATH\n" % it
open(os.path.join(RAIZ, ".cpanel.yml"), "w").write(yml)

# deploy.sh: lo ejecuta el cron de cPanel después de git pull (mismo contenido que .cpanel.yml)
sh = "#!/bin/bash\n# Generado por build.py. Copia el sitio al subdominio. No editar a mano.\n"
sh += "DEPLOYPATH=%s\n" % DEPLOYPATH
sh += 'cd "$(dirname "$0")" || exit 1\n'
for it in items:
    sh += "/bin/cp -R %s $DEPLOYPATH\n" % it
open(os.path.join(RAIZ, "deploy.sh"), "w").write(sh)

print("Páginas generadas:", len(salidas))
for p in salidas:
    print("  ", p)
