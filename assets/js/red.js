/* Red de nodos con pulsos: fondo animado del hero (sin librerías) */
(function () {
  var canvas = document.getElementById("red-hero");
  if (!canvas) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { canvas.remove(); return; }
  var ctx = canvas.getContext("2d");
  var hero = canvas.parentElement;
  var W, H, dpr, nodos = [], pulsos = [], raton = { x: -9999, y: -9999, activo: false };
  var movil = window.matchMedia("(max-width: 700px)").matches;
  var N = movil ? 34 : 80, DIST = movil ? 110 : 150, visible = true, ultimo = 0;

  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function crear() {
    nodos = [];
    for (var i = 0; i < N; i++) {
      nodos.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: 1.2 + Math.random() * 1.6, f: Math.random() * Math.PI * 2 });
    }
  }
  function pulso() {
    // elige un par de nodos cercanos y lanza una chispa que viaja entre ellos
    for (var k = 0; k < 20; k++) {
      var a = nodos[(Math.random() * N) | 0], b = nodos[(Math.random() * N) | 0];
      if (a === b) continue;
      var dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < DIST) { pulsos.push({ a: a, b: b, t: 0, v: .012 + Math.random() * .01 }); return; }
    }
  }
  function paso(ts) {
    if (!visible) { requestAnimationFrame(paso); return; }
    var dt = Math.min(32, ts - ultimo) / 16.7; ultimo = ts;
    ctx.clearRect(0, 0, W, H);
    // mover nodos
    for (var i = 0; i < N; i++) {
      var n = nodos[i];
      n.f += .01 * dt;
      n.x += (n.vx + Math.sin(n.f) * .08) * dt; n.y += (n.vy + Math.cos(n.f) * .08) * dt;
      if (raton.activo) {
        var mx = raton.x - n.x, my = raton.y - n.y, md = mx * mx + my * my;
        if (md < 220 * 220 && md > 1) { var f = (1 - Math.sqrt(md) / 220) * .35; n.x += mx / Math.sqrt(md) * f * dt; n.y += my / Math.sqrt(md) * f * dt; }
      }
      if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20; if (n.y > H + 20) n.y = -20;
    }
    // líneas
    ctx.lineWidth = 1;
    for (i = 0; i < N; i++) {
      for (var j = i + 1; j < N; j++) {
        var a = nodos[i], b = nodos[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < DIST * DIST) {
          var al = (1 - Math.sqrt(d2) / DIST) * .28;
          ctx.strokeStyle = "rgba(245,154,35," + al.toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    // nodos
    for (i = 0; i < N; i++) {
      n = nodos[i];
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
    // pulsos (mensajes viajando)
    for (i = pulsos.length - 1; i >= 0; i--) {
      var p = pulsos[i]; p.t += p.v * dt;
      if (p.t >= 1) { pulsos.splice(i, 1); continue; }
      var px = p.a.x + (p.b.x - p.a.x) * p.t, py = p.a.y + (p.b.y - p.a.y) * p.t;
      var g = ctx.createRadialGradient(px, py, 0, px, py, 10);
      g.addColorStop(0, "rgba(255,210,150,1)"); g.addColorStop(.35, "rgba(229,124,29,.9)"); g.addColorStop(1, "rgba(229,124,29,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill();
    }
    if (Math.random() < (movil ? .02 : .045)) pulso();
    requestAnimationFrame(paso);
  }
  medir(); crear();
  window.addEventListener("resize", function () { medir(); crear(); });
  hero.addEventListener("mousemove", function (e) { var r = canvas.getBoundingClientRect(); raton.x = e.clientX - r.left; raton.y = e.clientY - r.top; raton.activo = true; });
  hero.addEventListener("mouseleave", function () { raton.activo = false; });
  if ("IntersectionObserver" in window) { new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero); }
  document.addEventListener("visibilitychange", function () { visible = !document.hidden; });
  requestAnimationFrame(paso);
})();
