/* masiva.ec — interacciones (sin dependencias) */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Cabecera compacta al hacer scroll */
  var cab = document.querySelector(".cabecera");
  if (cab) {
    var onScroll = function () { cab.classList.toggle("compacta", window.scrollY > 80); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Menú móvil */
  var ham = document.querySelector(".hamburguesa");
  if (ham && cab) {
    ham.addEventListener("click", function () {
      var abierto = cab.classList.toggle("menu-abierto");
      ham.setAttribute("aria-expanded", abierto ? "true" : "false");
      document.body.style.overflow = abierto ? "hidden" : "";
    });
  }

  /* Desplegable "Conoce más" */
  document.querySelectorAll(".desplegable").forEach(function (d) {
    var btn = d.querySelector("button");
    if (!btn) return;
    var cerrar = function () { d.classList.remove("abierto"); btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var ab = d.classList.toggle("abierto");
      btn.setAttribute("aria-expanded", ab ? "true" : "false");
    });
    d.addEventListener("mouseenter", function () {
      if (window.matchMedia("(hover:hover)").matches && window.innerWidth > 960) { d.classList.add("abierto"); btn.setAttribute("aria-expanded", "true"); }
    });
    var temporizador;
    d.addEventListener("mouseenter", function () { clearTimeout(temporizador); });
    d.addEventListener("mouseleave", function () { if (window.innerWidth > 960) temporizador = setTimeout(cerrar, 180); });
    document.addEventListener("click", function (e) { if (!d.contains(e.target)) cerrar(); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") { cerrar(); btn.focus(); } });
  });

  /* Reveal al entrar en pantalla */
  var revelar = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revelar.forEach(function (el) { io.observe(el); });
  } else {
    revelar.forEach(function (el) { el.classList.add("visible"); });
  }

  /* Secuencia del hero: los mensajes llegan uno a uno */
  var mensajes = document.querySelectorAll(".escena .msg, .escena .canal");
  if (mensajes.length) {
    if (reduce) { mensajes.forEach(function (m) { m.classList.add("visible"); }); }
    else {
      var orden = Array.prototype.slice.call(mensajes).sort(function (a, b) {
        return (+a.dataset.t || 0) - (+b.dataset.t || 0);
      });
      orden.forEach(function (m) {
        setTimeout(function () { m.classList.add("visible"); }, 500 + (+m.dataset.t || 0));
      });
    }
  }

  /* Marquee: duplica la pista para el bucle continuo */
  var pista = document.querySelector(".marquee-pista");
  if (pista) { pista.innerHTML += pista.innerHTML; }

  /* Año en el pie */
  var anio = document.querySelector("[data-anio]");
  if (anio) anio.textContent = new Date().getFullYear();
})();

/* Selector de período (hosting) */
document.querySelectorAll('[data-periodo-btn]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var sec = btn.closest('[data-periodo]');
    if (!sec) return;
    sec.setAttribute('data-periodo', btn.getAttribute('data-periodo-btn'));
    sec.querySelectorAll('[data-periodo-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
  });
});

/* Filtro de tablas (SMS internacional) */
document.querySelectorAll('input[data-filtra]').forEach(function (input) {
  var tabla = document.querySelector(input.getAttribute('data-filtra'));
  if (!tabla) return;
  var filas = Array.prototype.slice.call(tabla.tBodies[0].rows);
  var vacio = document.getElementById('sin-resultados');
  var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  input.addEventListener('input', function () {
    var q = norm(input.value.trim());
    var visibles = 0;
    filas.forEach(function (f) {
      var ok = !q || norm(f.textContent).indexOf(q) !== -1;
      f.hidden = !ok; if (ok) visibles++;
    });
    if (vacio) vacio.hidden = visibles > 0;
  });
});

/* Filtro de categorías del blog (con #categoria en la URL) */
(function () {
  var botones = document.querySelectorAll('.filtro[data-filtro]');
  if (!botones.length) return;
  var tarjetas = document.querySelectorAll('#lista-blog .post-tarjeta');
  function aplicar(cat) {
    if (!document.querySelector('.filtro[data-filtro="' + cat + '"]')) cat = 'todos';
    botones.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filtro') === cat ? 'true' : 'false'); });
    tarjetas.forEach(function (t) { t.hidden = cat !== 'todos' && t.getAttribute('data-cat') !== cat; });
  }
  botones.forEach(function (b) {
    b.addEventListener('click', function () {
      var cat = b.getAttribute('data-filtro');
      history.replaceState(null, '', cat === 'todos' ? location.pathname : '#' + cat);
      aplicar(cat);
    });
  });
  aplicar(location.hash.replace('#', '') || 'todos');
})();
