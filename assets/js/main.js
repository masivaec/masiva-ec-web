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
    var lineas = [document.documentElement.lang === 'en' ? 'Hello MASIVA, I would like more information.' : 'Hola MASIVA, quiero información.'];
    f.querySelectorAll('input[name], select[name], textarea[name]').forEach(function (c) {
      var v = (c.value || '').trim(); if (!v) return;
      var et = f.querySelector('label[for="' + c.id + '"]');
      lineas.push((et ? et.textContent.trim() : c.name) + ': ' + v);
    });
    window.open('https://wa.me/593994488880?text=' + encodeURIComponent(lineas.join('\n')), '_blank', 'noopener');
  });
});

/* Selector de países (SMS internacional): una sola caja que busca y despliega */
(function () {
  var combo = document.querySelector('[data-combo]');
  var tabla = document.getElementById('tabla-paises');
  if (!combo || !tabla) return;
  var input = combo.querySelector('.pais-input'), flecha = combo.querySelector('.pais-flecha');
  var ul = combo.querySelector('.pais-lista'), bandComb = combo.querySelector('.pais-combo-bandera');
  var vacio = document.querySelector('.pais-vacio'), dato = document.querySelector('.pais-dato');
  var chips = document.querySelectorAll('.pais-chip');
  var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var EN = document.documentElement.lang === 'en';
  var paises = [], creado = false, elegido = null, idx = -1;
  Array.prototype.forEach.call(tabla.tBodies[0].rows, function (tr) {
    paises.push({ iso: tr.getAttribute('data-iso'), nombre: tr.cells[0].textContent.replace(/^\s*SMS (a|to)\s*/, '').trim(),
      prefijo: tr.cells[1].textContent.trim(), precio: tr.cells[2].textContent.trim(), tr: tr });
  });
  function bandera(iso) { return '<img class="bandera" src="/assets/img/banderas/' + iso + '.svg" alt="" width="24" height="18" loading="lazy">'; }
  function crearLista() {
    if (creado) return; creado = true;
    var html = '';
    paises.forEach(function (p, i) {
      html += '<li role="option" data-i="' + i + '" data-b="' + norm(p.nombre + ' ' + p.prefijo + ' ' + p.iso) + '"><span>' + bandera(p.iso) + p.nombre + '</span><small>' + p.prefijo + '</small></li>';
    });
    ul.innerHTML = html + '<li class="sin" hidden>' + (document.documentElement.lang === 'en' ? 'We could not find that country. Message us and we will confirm.' : 'No encontramos ese país. Escríbenos y lo confirmamos.') + '</li>';
  }
  function visibles() { return Array.prototype.filter.call(ul.querySelectorAll('li[data-i]'), function (li) { return !li.hidden; }); }
  function marcar(n) {
    var v = visibles(); idx = Math.max(-1, Math.min(n, v.length - 1));
    v.forEach(function (li, i) { li.classList.toggle('activo', i === idx); if (i === idx) li.scrollIntoView({ block: 'nearest' }); });
  }
  function abrir() { crearLista(); filtrar(); ul.hidden = false; combo.classList.add('abierto'); input.setAttribute('aria-expanded', 'true'); }
  function cerrar() { ul.hidden = true; combo.classList.remove('abierto'); input.setAttribute('aria-expanded', 'false'); idx = -1; }
  function filtrar() {
    var q = norm(input.value.trim()), n = 0;
    ul.querySelectorAll('li[data-i]').forEach(function (li) { var ok = !q || li.getAttribute('data-b').indexOf(q) !== -1; li.hidden = !ok; if (ok) n++; });
    ul.querySelector('.sin').hidden = n > 0; marcar(q ? 0 : -1);
  }
  function elegir(p) {
    elegido = p; input.value = p.nombre; bandComb.src = '/assets/img/banderas/' + p.iso + '.svg'; bandComb.hidden = false;
    vacio.hidden = true; dato.hidden = false;
    dato.style.animation = 'none'; dato.offsetHeight; dato.style.animation = '';
    var img = dato.querySelector('.pais-bandera'); img.src = '/assets/img/banderas/' + p.iso + '.svg'; img.alt = (EN ? 'Flag of ' : 'Bandera de ') + p.nombre;
    dato.querySelector('.pais-nombre').textContent = (EN ? 'SMS to ' : 'SMS a ') + p.nombre;
    dato.querySelector('.pais-prefijo').textContent = EN ? 'Prefix ' + p.prefijo + ' · all carriers' : 'Prefijo ' + p.prefijo + ' · todas las operadoras';
    dato.querySelector('.pais-precio b').textContent = p.precio;
    var cta = dato.querySelector('.pais-cta');
    cta.textContent = (EN ? 'I want to send SMS to ' : 'Quiero enviar SMS a ') + p.nombre;
    cta.href = 'https://wa.me/593994488880?text=' + encodeURIComponent((document.documentElement.lang === 'en' ? 'Hello MASIVA, I want to send SMS to ' : 'Hola MASIVA, quiero enviar SMS a ') + p.nombre + '.');
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-pais') === p.iso ? 'true' : 'false'); });
    cerrar();
  }
  input.addEventListener('focus', function () { if (elegido) { input.select(); } abrir(); });
  input.addEventListener('input', function () { bandComb.hidden = true; bandComb.removeAttribute('src'); elegido = null; if (ul.hidden) abrir(); filtrar(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { if (ul.hidden) abrir(); marcar(idx + 1); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { marcar(idx - 1); e.preventDefault(); }
    else if (e.key === 'Enter') { var v = visibles(); var li = v[idx] || v[0]; if (li) elegir(paises[+li.getAttribute('data-i')]); e.preventDefault(); }
    else if (e.key === 'Escape') { cerrar(); if (elegido) input.value = elegido.nombre; }
  });
  flecha.addEventListener('click', function () { if (ul.hidden) { input.focus(); } else { cerrar(); } });
  ul.addEventListener('mousedown', function (e) { e.preventDefault(); });
  ul.addEventListener('click', function (e) { var li = e.target.closest('li[data-i]'); if (li) elegir(paises[+li.getAttribute('data-i')]); });
  document.addEventListener('click', function (e) { if (!combo.contains(e.target)) { cerrar(); if (elegido) { input.value = elegido.nombre; bandComb.hidden = false; } } });
  chips.forEach(function (c) { c.addEventListener('click', function () { var p = paises.filter(function (x) { return x.iso === c.getAttribute('data-pais'); })[0]; if (p) elegir(p); }); });
  paises.forEach(function (p) { p.tr.addEventListener('click', function () { elegir(p); document.querySelector('.pais-panel').scrollIntoView({ behavior: 'smooth', block: 'center' }); }); });
})();

/* Tabla con scroll: oculta el degradado al llegar al final */
document.querySelectorAll('[data-scroll]').forEach(function (el) {
  var f = function () { el.classList.toggle('al-final', el.scrollTop + el.clientHeight >= el.scrollHeight - 4); };
  el.addEventListener('scroll', f); f();
});

/* Tarjetas: guardar el punto donde entra el cursor para la mancha naranja */
document.querySelectorAll('.grid-2>.tarjeta,.grid-3>.tarjeta,.grid-4>.tarjeta,.porque,.sector').forEach(function (c) {
  if (c.classList.contains('plan')) return;
  c.addEventListener('pointerenter', function (e) {
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
});

/* Mapa de contacto: se carga al interactuar o poco después de cargar la página, para no frenar la carga inicial */
(function(){
  var m=document.querySelector('[data-mapa]'); if(!m) return;
  var hecho=false;
  function cargar(){ if(hecho) return; hecho=true;
    var f=document.createElement('iframe'); f.src=m.getAttribute('data-mapa'); f.title='Mapa de la oficina de ventas de MASIVA en Quito';
    f.loading='lazy'; f.referrerPolicy='no-referrer-when-downgrade'; f.allowFullscreen=true; m.appendChild(f);
    f.addEventListener('load',function(){var e=m.querySelector('.mapa-espera'); if(e) e.remove();});
  }
  ['scroll','pointerdown','touchstart','keydown','mousemove'].forEach(function(ev){window.addEventListener(ev,cargar,{once:true,passive:true});});
  window.addEventListener('load',function(){setTimeout(cargar,3500);});
})();

/* Título del home: palabra que cambia con desenfoque a nítido */
(function(){
  var r=document.querySelector('.rota[data-palabras]'); if(!r) return;
  var t=r.querySelector('.rota-txt'), p=r.getAttribute('data-palabras').split('|'), i=0;
  var h1=r.closest('h1');
  function reservar(){ var a=t.textContent, m=0; h1.style.minHeight=''; p.forEach(function(x){ t.textContent=x; m=Math.max(m,h1.offsetHeight); }); t.textContent=a; h1.style.minHeight=m+'px'; }
  reservar(); window.addEventListener('resize',reservar);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setInterval(function(){
    t.classList.add('sale');
    setTimeout(function(){ i=(i+1)%p.length; t.textContent=p[i]; t.classList.remove('sale'); },500);
  },2600);
})();

/* Contadores: cuentan desde 0 al aparecer en pantalla */
(function(){
  var ns=document.querySelectorAll('.cifra-n[data-n]'); if(!ns.length||!('IntersectionObserver' in window)) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var fmt=function(v){return document.documentElement.lang==='en'?v.toLocaleString('en-US'):v.toLocaleString('es-EC').replace(/,/g,'.');};
  var io=new IntersectionObserver(function(es){es.forEach(function(e){ if(!e.isIntersecting) return; io.unobserve(e.target);
    var el=e.target, fin=+el.dataset.n, pre=el.dataset.pre||'', t0=null, d=1600;
    function paso(t){ if(!t0) t0=t; var k=Math.min((t-t0)/d,1), v=Math.round(fin*(1-Math.pow(1-k,3))); el.textContent=pre+fmt(v); if(k<1) requestAnimationFrame(paso); }
    el.textContent=pre+'0'; requestAnimationFrame(paso);
  });},{threshold:.5});
  ns.forEach(function(n){io.observe(n);});
})();

/* Paneles .maqueta animados: cursor, clic, filas que se envían y cifras que suben */
(function () {
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var EN = document.documentElement.lang === 'en';
  var ruta = location.pathname;
  var tipo = /sms/.test(ruta) ? 'sms' : (/email/.test(ruta) ? 'email' : 'home');
  var T = {
    es: { home: 'Lanzar campaña', sms: 'Enviar SMS', email: 'Enviar campaña', enviando: 'Enviando', listo: 'Listo' },
    en: { home: 'Launch campaign', sms: 'Send SMS', email: 'Send campaign', enviando: 'Sending', listo: 'Done' }
  }[EN ? 'en' : 'es'];
  var esperar = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function parseNum(txt) {
    var m = txt.match(/[\d.,]+/); if (!m) return null;
    var raw = m[0], dec = EN ? '.' : ',', mil = EN ? ',' : '.';
    var partes = raw.split(dec);
    var decimales = partes.length > 1 ? partes[1].length : 0;
    var valor = parseFloat(raw.split(mil).join('').replace(dec, '.'));
    return { valor: valor, dec: decimales, pre: txt.slice(0, m.index), suf: txt.slice(m.index + raw.length) };
  }
  function formatea(n, p) {
    var s = n.toFixed(p.dec).split('.');
    var ent = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, EN ? ',' : '.');
    return p.pre + ent + (p.dec ? (EN ? '.' : ',') + s[1] : '') + p.suf;
  }

  function prepara(maq) {
    var barra = maq.querySelector('.maqueta-barra');
    var stats = [].slice.call(maq.querySelectorAll('.maqueta-stats b'));
    var filas = [].slice.call(maq.querySelectorAll('.maqueta-filas > div'));
    if (!barra || !stats.length || !filas.length) return null;
    var btn = document.createElement('span');
    btn.className = 'maq-btn'; btn.textContent = T[tipo];
    barra.appendChild(btn);
    var cursor = document.createElement('span');
    cursor.className = 'maq-cursor';
    cursor.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.6L10 19z" fill="#fff" stroke="#1C1C1C" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    maq.appendChild(cursor);
    return {
      maq: maq, btn: btn, cursor: cursor,
      stats: stats.map(function (b) { return { el: b, txt: b.textContent, p: parseNum(b.textContent), caja: b.parentNode }; }),
      filas: filas.map(function (f) { var em = f.querySelector('em'); return { el: f, em: em, txt: em ? em.textContent : '', ok: em && em.classList.contains('ok') }; })
    };
  }

  function reinicia(d) {
    d.btn.textContent = T[tipo]; d.btn.className = 'maq-btn';
    d.stats.forEach(function (s) { if (s.p) s.el.textContent = formatea(0, s.p); s.caja.classList.remove('maq-brilla'); });
    d.filas.forEach(function (f) {
      f.el.classList.add('maq-espera'); f.el.classList.remove('maq-activa');
      if (f.em) { f.em.textContent = ''; f.em.className = 'maq-pend'; }
    });
    d.cursor.style.opacity = 0;
  }

  function centro(el, maq) {
    var a = el.getBoundingClientRect(), b = maq.getBoundingClientRect();
    return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2 };
  }

  function cuenta(d, ms) {
    var t0 = performance.now();
    return new Promise(function (fin) {
      (function paso(t) {
        var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
        d.stats.forEach(function (s) { if (s.p) s.el.textContent = formatea(s.p.valor * e, s.p); });
        if (k < 1) requestAnimationFrame(paso); else { d.stats.forEach(function (s) { s.el.textContent = s.txt; }); fin(); }
      })(t0);
    });
  }

  async function secuencia(d) {
    reinicia(d);
    await esperar(500);
    var m = d.maq.getBoundingClientRect();
    var destino = centro(d.btn, d.maq);
    d.cursor.style.opacity = 1;
    await d.cursor.animate([
      { transform: 'translate(' + (m.width * 0.7) + 'px,' + (m.height * 0.95) + 'px)' },
      { transform: 'translate(' + (destino.x - 4) + 'px,' + (destino.y - 2) + 'px)' }
    ], { duration: 1100, easing: 'cubic-bezier(.22,.8,.3,1)', fill: 'forwards' }).finished;
    d.btn.classList.add('maq-clic');
    d.cursor.animate([{ scale: 1 }, { scale: .82 }, { scale: 1 }], { duration: 260 });
    await esperar(260);
    d.btn.classList.remove('maq-clic'); d.btn.classList.add('maq-enviando');
    d.btn.textContent = T.enviando;
    d.cursor.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, delay: 300, fill: 'forwards' });
    var conteo = cuenta(d, 600 * d.filas.length + 900);
    for (var i = 0; i < d.filas.length; i++) {
      var f = d.filas[i];
      f.el.classList.remove('maq-espera'); f.el.classList.add('maq-activa');
      await esperar(520);
      if (f.em) {
        f.em.className = f.ok ? 'ok' : ''; f.em.textContent = f.txt;
        f.em.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: .6 }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
      }
      await esperar(120);
    }
    await conteo;
    d.btn.classList.remove('maq-enviando'); d.btn.classList.add('maq-listo');
    d.btn.textContent = '✓ ' + T.listo;
    d.stats[0].caja.classList.add('maq-brilla');
  }

  document.querySelectorAll('.maqueta').forEach(function (maq) {
    var d = prepara(maq); if (!d) return;
    reinicia(d);
    var visible = false, corriendo = false;
    async function bucle() {
      if (corriendo) return; corriendo = true;
      while (visible) { await secuencia(d); await esperar(3800); }
      corriendo = false;
    }
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) bucle();
    }, { threshold: 0.45 }).observe(maq);
  });
})();
