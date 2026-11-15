# masiva.ec

Sitio web estático de MASIVA-EC S.A.

## Estructura
- `src/partials/` cabecera y pie únicos.
- `src/pages/*.html` contenido de cada página con front-matter (`title`, `description`, `path`, `h1`, `servicio`, `faq_json`, `noindex`).
- `build.py` genera `index.html`, `/<slug>/index.html`, `404.html` y `.cpanel.yml`.
- `assets/` CSS, JS, fuentes e imágenes.

## Flujo
1. Editar `src/` y `assets/`.
2. `python3 build.py`
3. Commit y push a `main`.
4. cPanel → Git Version Control → Update from Remote → Deploy HEAD Commit.

Nada secreto en este repositorio (es público).
