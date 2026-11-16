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

/* Formularios de contacto: arman el mensaje y lo abren en WhatsApp (temporal, hasta conectar el CRM) */
document.querySelectorAll('form[data-whatsapp]').forEach(function (f) {
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!f.reportValidity()) return;
    var lineas = ['Hola MASIVA, quiero información.'];
    f.querySelectorAll('input[name], select[name], textarea[name]').forEach(function (c) {
      var v = (c.value || '').trim(); if (!v) return;
      var et = f.querySelector('label[for="' + c.id + '"]');
      lineas.push((et ? et.textContent.trim() : c.name) + ': ' + v);
    });
    window.open('https://wa.me/593994488880?text=' + encodeURIComponent(lineas.join('\n')), '_blank', 'noopener');
  });
});

/* Selector de países (SMS internacional): toma los datos de la tabla #tabla-paises */
(function () {
  var combo = document.querySelector('[data-combo]');
  var tabla = document.getElementById('tabla-paises');
  if (!combo || !tabla) return;
  var boton = combo.querySelector('.pais-boton'), panel = combo.querySelector('.pais-lista');
  var buscar = panel.querySelector('input'), ul = panel.querySelector('ul'), actual = combo.querySelector('.pais-actual');
  var vacio = document.querySelector('.pais-vacio'), dato = document.querySelector('.pais-dato');
  var chips = document.querySelectorAll('.pais-chip');
  var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var paises = [], creado = false;
  Array.prototype.forEach.call(tabla.tBodies[0].rows, function (tr) {
    paises.push({ iso: tr.getAttribute('data-iso'), nombre: tr.cells[0].textContent.replace(/^\s*SMS a\s*/, '').trim(),
      prefijo: tr.cells[1].textContent.trim(), precio: tr.cells[2].textContent.trim(), tr: tr });
  });
  function bandera(iso, w, h) { return '<img class="bandera" src="/assets/img/banderas/' + iso + '.svg" alt="" width="' + w + '" height="' + h + '" loading="lazy">'; }
  function crearLista() {
    if (creado) return; creado = true;
    var html = '';
    paises.forEach(function (p, i) {
      html += '<li role="option" data-i="' + i + '" data-b="' + norm(p.nombre + ' ' + p.prefijo + ' ' + p.iso) + '"><span>' + bandera(p.iso, 24, 18) + p.nombre + '</span><small>' + p.prefijo + '</small></li>';
    });
    ul.innerHTML = html + '<li class="sin" hidden>No encontramos ese país. Escríbenos y lo confirmamos.</li>';
  }
  function abrir() { crearLista(); panel.hidden = false; boton.setAttribute('aria-expanded', 'true'); buscar.value = ''; filtrar(); setTimeout(function () { buscar.focus(); }, 30); }
  function cerrar() { panel.hidden = true; boton.setAttribute('aria-expanded', 'false'); }
  function filtrar() {
    var q = norm(buscar.value.trim()), n = 0;
    ul.querySelectorAll('li[data-i]').forEach(function (li) { var ok = !q || li.getAttribute('data-b').indexOf(q) !== -1; li.hidden = !ok; if (ok) n++; });
    ul.querySelector('.sin').hidden = n > 0;
  }
  function elegir(p) {
    actual.innerHTML = bandera(p.iso, 24, 18) + 'SMS a ' + p.nombre;
    vacio.hidden = true; dato.hidden = false;
    dato.style.animation = 'none'; dato.offsetHeight; dato.style.animation = '';
    var img = dato.querySelector('.pais-bandera'); img.src = '/assets/img/banderas/' + p.iso + '.svg'; img.alt = 'Bandera de ' + p.nombre;
    dato.querySelector('.pais-nombre').textContent = 'SMS a ' + p.nombre;
    dato.querySelector('.pais-prefijo').textContent = 'Prefijo ' + p.prefijo + ' · todas las operadoras';
    dato.querySelector('.pais-precio b').textContent = p.precio;
    var cta = dato.querySelector('.pais-cta');
    cta.textContent = 'Quiero enviar SMS a ' + p.nombre;
    cta.href = 'https://wa.me/593994488880?text=' + encodeURIComponent('Hola MASIVA, quiero enviar SMS a ' + p.nombre + '.');
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-pais') === p.iso ? 'true' : 'false'); });
    cerrar();
  }
  boton.addEventListener('click', function () { panel.hidden ? abrir() : cerrar(); });
  buscar.addEventListener('input', filtrar);
  buscar.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { var li = ul.querySelector('li[data-i]:not([hidden])'); if (li) elegir(paises[+li.getAttribute('data-i')]); e.preventDefault(); }
    if (e.key === 'Escape') { cerrar(); boton.focus(); }
  });
  ul.addEventListener('click', function (e) { var li = e.target.closest('li[data-i]'); if (li) elegir(paises[+li.getAttribute('data-i')]); });
  document.addEventListener('click', function (e) { if (!combo.contains(e.target)) cerrar(); });
  chips.forEach(function (c) { c.addEventListener('click', function () { var p = paises.filter(function (x) { return x.iso === c.getAttribute('data-pais'); })[0]; if (p) elegir(p); }); });
  paises.forEach(function (p) { p.tr.addEventListener('click', function () { elegir(p); document.querySelector('.pais-panel').scrollIntoView({ behavior: 'smooth', block: 'center' }); }); });
})();
