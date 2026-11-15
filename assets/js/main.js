/* masiva.ec — interacciones (sin dependencias) */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Cabecera compacta al hacer scroll */
  var cab = document.querySelector(".cabecera");
  if (cab) {
    var onScroll = function () { cab.classList.toggle("compacta", window.scrollY > 24); };
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
    d.addEventListener("mouseleave", function () { if (window.innerWidth > 960) cerrar(); });
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
