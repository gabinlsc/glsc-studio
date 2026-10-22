(function () {
  'use strict';
  var D = window.Demo, $ = D.$, $$ = D.$$;
  var NS = 'http://www.w3.org/2000/svg';
  var eur = function (n) { return n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'; };
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var ymd = function (d) { return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
  var addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };

  /* ---------- Saison courante ---------- */
  function season(d) { var m = d.getMonth() + 1; return m === 7 || m === 8 ? 'high' : (m >= 4 && m <= 6) || m === 9 || m === 10 ? 'mid' : 'low'; }
  var RATE = { low: 95, mid: 130, high: 185 }, MIN = { low: 2, mid: 3, high: 7 };
  var cur = $('#seasons [data-s="' + season(today) + '"]'); if (cur) cur.classList.add('now');

  /* ---------- Indisponibilités (déterministes, pour la démonstration) ---------- */
  function busy(d) { if (d < today) return true; var k = d.getFullYear() * 400 + d.getMonth() * 33 + Math.floor(d.getDate() / 5); return (k * 2654435761 >>> 0) % 100 < (season(d) === 'high' ? 55 : 24); }

  /* ---------- Calendrier ---------- */
  var base = new Date(today.getFullYear(), today.getMonth(), 1), a = null, b = null, guests = 2;
  var MFMT = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }), LFMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  function monthEl(first) {
    var wrap = document.createElement('div'); wrap.className = 'month';
    var t = document.createElement('table'); t.setAttribute('role', 'grid'); t.setAttribute('aria-label', MFMT.format(first));
    var head = '<thead><tr>' + ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(function (x, i) { return '<th scope="col" abbr="' + ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'][i] + '">' + x + '</th>'; }).join('') + '</tr></thead>';
    t.innerHTML = head; var tb = document.createElement('tbody'), row, pad = (first.getDay() + 6) % 7, n = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    for (var i = 0; i < pad + n; i++) {
      if (i % 7 === 0) { row = document.createElement('tr'); tb.append(row); }
      var td = document.createElement('td'); row.append(td); if (i < pad) continue;
      var d = new Date(first.getFullYear(), first.getMonth(), i - pad + 1), btn = document.createElement('button'); btn.type = 'button'; btn.className = 'day'; btn.textContent = d.getDate(); btn.dataset.k = ymd(d);
      var isBusy = busy(d); btn.disabled = isBusy; if (isBusy && d >= today) btn.classList.add('busy');
      btn.setAttribute('aria-label', LFMT.format(d) + (isBusy ? ', indisponible' : ''));
      if (+d === +today) btn.classList.add('today');
      btn.addEventListener('click', function (dd) { return function () { pick(dd); }; }(d)); td.append(btn);
    }
    t.append(tb); wrap.append(t); return wrap;
  }
  function paint() {
    $$('.day').forEach(function (el) {
      var k = +el.dataset.k; el.classList.remove('start', 'end', 'in');
      if (a && k === ymd(a)) el.classList.add('start'); if (b && k === ymd(b)) el.classList.add('end'); if (a && b && k > ymd(a) && k < ymd(b)) el.classList.add('in');
    });
  }
  function render() {
    var g = $('#c-grid'); g.textContent = ''; var m2 = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    g.append(monthEl(base), monthEl(m2));
    $('#c-title').innerHTML = ''; [base, m2].forEach(function (m) { var s = document.createElement('span'); s.textContent = MFMT.format(m); $('#c-title').append(s); });
    $('#c-prev').disabled = base <= new Date(today.getFullYear(), today.getMonth(), 1);
    paint();
  }
  $('#c-prev').addEventListener('click', function () { base = new Date(base.getFullYear(), base.getMonth() - 1, 1); render(); });
  $('#c-next').addEventListener('click', function () { base = new Date(base.getFullYear(), base.getMonth() + 1, 1); render(); });
  function pick(d) {
    if (!a || (a && b) || d <= a) { a = d; b = null; } else {
      var ok = true; for (var x = addDays(a, 1); x < d; x = addDays(x, 1)) if (busy(x)) { ok = false; break; }
      if (ok) b = d; else { a = d; b = null; }
    }
    paint(); summary();
  }
  function summary() {
    var has = a && b; $('#s-empty').hidden = !!a; $('#s-box').hidden = !a; if (!a) return;
    var D1 = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
    $('#s-dates').textContent = b ? 'Du ' + D1.format(a) + ' au ' + D1.format(b) : 'Arrivée le ' + D1.format(a) + '. Choisissez le départ.';
    var lines = $('#s-lines'), warn = $('#s-warn'); lines.textContent = ''; warn.hidden = true; $('#s-go').disabled = !has;
    if (!has) return;
    var nights = Math.round((b - a) / 864e5), sub = 0, parts = {};
    for (var i = 0; i < nights; i++) { var d = addDays(a, i), s = season(d); sub += RATE[s]; parts[s] = (parts[s] || 0) + 1; }
    var need = Math.max.apply(null, Object.keys(parts).map(function (s) { return MIN[s]; }));
    var add = function (l, v, cls) { var r = document.createElement('div'); if (cls) r.className = cls; var dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = l; dd.textContent = v; dd.className = 'tnum'; r.append(dt, dd); lines.append(r); };
    var names = { low: 'basse saison', mid: 'moyenne saison', high: 'haute saison' };
    Object.keys(parts).forEach(function (s) { add(parts[s] + ' nuit' + (parts[s] > 1 ? 's' : '') + ' · ' + names[s], eur(parts[s] * RATE[s])); });
    var clean = 60, tax = Math.round(1.2 * guests * nights * 100) / 100; add('Ménage de fin de séjour', eur(clean)); add('Taxe de séjour (' + guests + ' voyageur' + (guests > 1 ? 's' : '') + ')', eur(tax)); add('Total', eur(sub + clean + tax), 'tot');
    if (nights < need) { warn.hidden = false; warn.textContent = 'Séjour minimum : ' + need + ' nuits sur cette période' + (need === 7 ? ' (du samedi au samedi).' : '.'); $('#s-go').disabled = true; }
    else if (need === 7 && (a.getDay() !== 6 || nights % 7)) { warn.hidden = false; warn.textContent = 'En haute saison, les séjours vont du samedi au samedi.'; $('#s-go').disabled = true; }
  }
  $('#v-m').addEventListener('click', function () { guests = Math.max(1, guests - 1); $('#v-o').textContent = guests; summary(); });
  $('#v-p').addEventListener('click', function () { guests = Math.min(6, guests + 1); $('#v-o').textContent = guests; summary(); });
  $('#s-go').addEventListener('click', function () { $('#s-box').hidden = true; $('#s-done').hidden = false; });
  $('#s-reset').addEventListener('click', function () { $('#s-done').hidden = true; a = b = null; paint(); summary(); });
  render(); summary();

  /* ---------- Galerie horizontale ---------- */
  var rail = $('#rail'), step = function () { return Math.min(rail.clientWidth * .7, 640) + 16; };
  $('#g-prev').addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: D.calm ? 'auto' : 'smooth' }); });
  $('#g-next').addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: D.calm ? 'auto' : 'smooth' }); });
  rail.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); $('#g-next').click(); } if (e.key === 'ArrowLeft') { e.preventDefault(); $('#g-prev').click(); } });
  var drag = null; rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; drag = { x: e.clientX, s: rail.scrollLeft }; rail.style.scrollSnapType = 'none'; rail.setPointerCapture(e.pointerId); });
  rail.addEventListener('pointermove', function (e) { if (drag) rail.scrollLeft = drag.s - (e.clientX - drag.x); });
  var endDrag = function () { if (!drag) return; drag = null; rail.style.scrollSnapType = ''; }; rail.addEventListener('pointerup', endDrag); rail.addEventListener('pointercancel', endDrag);

  /* ---------- Plan ---------- */
  var P = { plage: [90, 250, 'Plage'], pain: [215, 150, 'Boulangerie'], port: [420, 110, 'Port'], alignements: [250, 355, 'Alignements'] }, pts = $('#pts');
  Object.keys(P).forEach(function (k) {
    var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'pt'); g.dataset.p = k;
    g.innerHTML = '<line x1="150" y1="260" x2="' + P[k][0] + '" y2="' + P[k][1] + '"/><circle cx="' + P[k][0] + '" cy="' + P[k][1] + '" r="9"/><text x="' + P[k][0] + '" y="' + (P[k][1] - 16) + '" text-anchor="middle">' + P[k][2] + '</text>';
    pts.append(g);
  });
  function place(k) { $$('.pt').forEach(function (g) { g.classList.toggle('on', g.dataset.p === k); }); $$('#places button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.p === k)); }); }
  $$('#places button').forEach(function (b) { b.addEventListener('click', function () { place(b.dataset.p); }); b.addEventListener('mouseenter', function () { place(b.dataset.p); }); });
  place('plage');
})();
