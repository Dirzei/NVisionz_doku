// Rechendemos der Website (WB11, 2026-10-04). Nur im Ziel "web": tools/Seitenbau.java
// bindet diese Datei auf Seiten mit <div class="demo" data-demo="..."> ein. Ohne Skript
// (und im Viewer der Apps) steht an derselben Stelle das GIF aus _erzeuger/<modul>/Demo*.java,
// das dieselbe Rechnung zeigt. Keine Bibliothek.
(function () {
  'use strict';
  var AK = '#1f5f8b', HELL = '#e8f0f6', TEXT = '#5b6475', HERV = '#9a6400';
  var DE = (document.documentElement.lang || 'de').indexOf('de') === 0;

  function leinwand(div, b, h) {
    var c = document.createElement('canvas');
    var r = window.devicePixelRatio || 1;
    c.width = b * r; c.height = h * r;
    c.style.width = '100%'; c.style.maxWidth = b + 'px'; c.style.height = 'auto';
    c.style.display = 'block'; c.style.touchAction = 'none';
    div.appendChild(c);
    var g = c.getContext('2d');
    g.setTransform(r, 0, 0, r, 0, 0);
    g.font = '12px sans-serif';
    return {c: c, g: g, b: b, h: h};
  }
  function grund(l) { l.g.fillStyle = '#ffffff'; l.g.fillRect(0, 0, l.b, l.h); }
  function feld(g, l, o, r, u) {
    g.fillStyle = HELL; g.fillRect(l, o, r - l, u - o);
    g.strokeStyle = TEXT; g.lineWidth = 1; g.strokeRect(l + 0.5, o + 0.5, r - l, u - o);
  }
  function linie(g, farbe, breite, xs, ys) {
    g.strokeStyle = farbe; g.lineWidth = breite; g.lineJoin = 'round'; g.beginPath();
    for (var i = 0; i < xs.length; i++) { if (i) { g.lineTo(xs[i], ys[i]); } else { g.moveTo(xs[i], ys[i]); } }
    g.stroke();
  }
  function text(g, t, x, y) { g.fillStyle = TEXT; g.fillText(t, x, y); }
  function regler(div, name, min, max, schritt, wert, neu) {
    var p = document.createElement('label');
    p.className = 'regler';
    var s = document.createElement('input');
    s.type = 'range'; s.min = min; s.max = max; s.step = schritt; s.value = wert;
    var w = document.createElement('span');
    p.appendChild(document.createTextNode(name + ' '));
    p.appendChild(s); p.appendChild(w);
    div.appendChild(p);
    function auf() { w.textContent = ' ' + s.value; neu(parseFloat(s.value)); }
    s.addEventListener('input', auf);
    auf();
  }

  // ---- FFT: zwei Schwingungen, Betragsspektrum (wie DemoFft.java, dort RealFft)
  function fft(div) {
    var l = leinwand(div, 480, 260), g = l.g, n = 64;
    regler(div, DE ? 'Frequenz k₂' : 'frequency k₂', 1, 31, 1, 14, function (k2) {
      var x = [], i, k;
      for (i = 0; i < n; i++) {
        x.push(Math.sin(2 * Math.PI * 5 * i / n) + 0.6 * Math.sin(2 * Math.PI * k2 * i / n));
      }
      grund(l);
      feld(g, 40, 22, 466, 112);
      var px = [], py = [];
      for (i = 0; i < n; i++) { px.push(40 + 426 * i / (n - 1)); py.push(67 - 28 * x[i]); }
      linie(g, AK, 2, px, py);
      text(g, 'x[n] = sin(2π·5n/64) + 0.6·sin(2π·' + k2 + 'n/64)', 40, 15);
      feld(g, 40, 140, 466, 236);
      for (k = 0; k <= n / 2; k++) {
        var re = 0, im = 0;
        for (i = 0; i < n; i++) {
          re += x[i] * Math.cos(2 * Math.PI * k * i / n);
          im -= x[i] * Math.sin(2 * Math.PI * k * i / n);
        }
        var a = 2 * Math.sqrt(re * re + im * im) / n, h = Math.round(88 * a);
        g.fillStyle = (k === 5 || k === k2) ? HERV : AK;
        g.fillRect(Math.round(40 + 426 * k / (n / 2)) - 3, 236 - h, 6, h);
      }
      text(g, '|X[k]|  (N = 64)', 40, 133);
      for (k = 0; k <= 32; k += 8) { text(g, String(k), Math.round(40 + 426 * k / 32) - 4, 252); }
    });
  }

  // ---- natuerlicher kubischer Spline, Punkte zum Ziehen (wie DemoSpline.java, dort CubicSpline)
  function spline(div) {
    var l = leinwand(div, 480, 260), g = l.g;
    var X = [0, 1, 2, 3, 4, 5, 6], Y = [0.2, 0.8, 0.5, 0.5, 0.3, 0.9, 0.6];
    var L = 40, R = 460, O = 20, U = 230, gezogen = -1;
    function momente(y) {
      var n = X.length, a = [], b = [], c = [], d = [], m = new Array(n).fill(0), i;
      for (i = 1; i < n - 1; i++) {
        var h0 = X[i] - X[i - 1], h1 = X[i + 1] - X[i];
        a.push(h0 / 6); b.push((h0 + h1) / 3); c.push(h1 / 6);
        d.push((y[i + 1] - y[i]) / h1 - (y[i] - y[i - 1]) / h0);
      }
      for (i = 1; i < d.length; i++) {
        var w = a[i] / b[i - 1]; b[i] -= w * c[i - 1]; d[i] -= w * d[i - 1];
      }
      for (i = d.length - 1; i >= 0; i--) {
        m[i + 1] = (d[i] - (i < d.length - 1 ? c[i] * m[i + 2] : 0)) / b[i];
      }
      return m;
    }
    function wert(y, m, x) {
      var i = Math.min(X.length - 2, Math.max(0, Math.floor(x)));
      var h = X[i + 1] - X[i], t1 = X[i + 1] - x, t0 = x - X[i];
      return m[i] * t1 * t1 * t1 / (6 * h) + m[i + 1] * t0 * t0 * t0 / (6 * h)
           + (y[i] / h - m[i] * h / 6) * t1 + (y[i + 1] / h - m[i + 1] * h / 6) * t0;
    }
    function zeichne() {
      var m = momente(Y), px = [], py = [], i;
      grund(l); feld(g, L, O, R, U);
      for (i = 0; i <= 240; i++) {
        var x = 6 * i / 240;
        px.push(L + (R - L) * x / 6); py.push(U - (U - O) * wert(Y, m, x));
      }
      linie(g, AK, 2.5, px, py);
      for (i = 0; i < X.length; i++) {
        g.fillStyle = i === gezogen ? HERV : AK;
        g.beginPath(); g.arc(L + (R - L) * X[i] / 6, U - (U - O) * Y[i], 6, 0, 2 * Math.PI); g.fill();
      }
      text(g, DE ? 'Natürlicher kubischer Spline – Punkte senkrecht ziehen' : 'Natural cubic spline – drag the points up and down', L, 14);
    }
    function lage(e) {
      var r = l.c.getBoundingClientRect();
      return {x: (e.clientX - r.left) * l.b / r.width, y: (e.clientY - r.top) * l.h / r.height};
    }
    l.c.addEventListener('pointerdown', function (e) {
      var p = lage(e), i;
      for (i = 0; i < X.length; i++) {
        var dx = p.x - (L + (R - L) * X[i] / 6), dy = p.y - (U - (U - O) * Y[i]);
        if (dx * dx + dy * dy < 200) { gezogen = i; l.c.setPointerCapture(e.pointerId); zeichne(); return; }
      }
    });
    l.c.addEventListener('pointermove', function (e) {
      if (gezogen < 0) { return; }
      Y[gezogen] = Math.min(1, Math.max(0, (U - lage(e).y) / (U - O)));
      zeichne();
    });
    l.c.addEventListener('pointerup', function () { gezogen = -1; zeichne(); });
    zeichne();
  }

  // ---- zweiseitiger z-Test: p-Wert als Flaeche (wie DemoTest.java, dort Normal)
  function erfc(x) {
    // rationale Naeherung erfcc (Numerical Recipes, Abschn. 6.2), relativer Fehler < 1,2e-7
    var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
            t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
            t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  function ztest(div) {
    var l = leinwand(div, 480, 260), g = l.g, L = 40, R = 460, O = 30, U = 220, grenze = 1.959964;
    function px(x) { return L + (R - L) * (x + 4) / 8; }
    function py(d) { return U - (U - O) * d / 0.42; }
    function pdf(x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); }
    regler(div, DE ? 'beobachtetes z' : 'observed z', 0, 3.5, 0.01, 2, function (z) {
      var p = erfc(z / Math.SQRT2), s, i;
      grund(l); feld(g, L, O, R, U);
      g.fillStyle = 'rgba(154,100,0,0.43)';
      for (s = -1; s <= 1; s += 2) {
        g.beginPath(); g.moveTo(px(s * z), U);
        for (i = 0; i <= 80; i++) { var x = s * z + (s * 4 - s * z) * i / 80; g.lineTo(px(x), py(pdf(x))); }
        g.lineTo(px(s * 4), U); g.closePath(); g.fill();
      }
      var xs = [], ys = [];
      for (i = 0; i <= 240; i++) { var v = -4 + 8 * i / 240; xs.push(px(v)); ys.push(py(pdf(v))); }
      linie(g, AK, 2.5, xs, ys);
      g.setLineDash([4, 3]); g.strokeStyle = TEXT; g.lineWidth = 1;
      [-grenze, grenze].forEach(function (c) { g.beginPath(); g.moveTo(px(c), O); g.lineTo(px(c), U); g.stroke(); });
      g.setLineDash([]); g.strokeStyle = HERV; g.lineWidth = 2;
      g.beginPath(); g.moveTo(px(z), O); g.lineTo(px(z), U); g.stroke();
      var zt = z.toFixed(2), pt = p.toFixed(4);
      if (DE) { zt = zt.replace('.', ','); pt = pt.replace('.', ','); }
      text(g, 'z = ' + zt + '    p = ' + pt + '    ' + (p < 0.05 ? (DE ? 'verwerfen bei α = 0,05' : 'reject at α = 0.05')
                                                       : (DE ? 'nicht verwerfen bei α = 0,05' : 'do not reject at α = 0.05')), L, 20);
      for (i = -4; i <= 4; i += 2) { text(g, String(i).replace('-', '−'), px(i) - 4, U + 16); }
    });
  }

  var demos = {fft: fft, spline: spline, ztest: ztest};
  document.querySelectorAll('div.demo[data-demo]').forEach(function (d) {
    var f = demos[d.getAttribute('data-demo')];
    if (!f || !document.createElement('canvas').getContext) { return; }
    var bild = d.querySelector('img');
    if (bild) { bild.style.display = 'none'; }
    f(d);
  });
})();
