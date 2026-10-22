(function () {
  'use strict';
  var D = window.Demo, $ = D.$, $$ = D.$$;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var eur = function (n) { return n.toLocaleString('fr-FR') + ' €'; };
  function nextDay(dow, minDays) { var d = new Date(today); d.setDate(d.getDate() + (minDays || 0)); while (d.getDay() !== dow) d.setDate(d.getDate() + 1); return d; }
  var wk = function (n) { return n * 7; };
  var EV = [
    { off: [4, 0], t: 'Marée Haute', sub: 'Rock indé · trois groupes bretons', type: 'concert', cap: 600, sold: 410, tiers: [['Prévente', 14], ['Sur place', 18]], doors: '20 h' },
    { off: [5, 0], t: 'Nuit Électrique', sub: 'Live électronique · Mara K. + Lowtide', type: 'concert', cap: 600, sold: 530, tiers: [['Prévente', 16], ['Sur place', 20]], doors: '21 h' },
    { off: [6, 0], t: 'Quai Club', sub: 'House et disco · résidents + invité', type: 'club', cap: 600, sold: 240, tiers: [['Avant 1 h', 8], ['Après 1 h', 12]], doors: '23 h' },
    { off: [5, 7], t: 'Soirée années 90', sub: 'Dress code encouragé, bar à cocktails dédié', type: 'special', cap: 600, sold: 600, tiers: [['Prévente', 10], ['Sur place', 14]], doors: '22 h' },
    { off: [6, 7], t: 'Quai Club', sub: 'Techno mélodique · Hélène V. (invitée)', type: 'club', cap: 600, sold: 120, tiers: [['Avant 1 h', 8], ['Après 1 h', 12]], doors: '23 h' },
    { off: [4, 14], t: 'Les Veilleurs', sub: 'Chanson et cuivres · quintet lorientais', type: 'concert', cap: 400, sold: 90, tiers: [['Prévente', 12], ['Sur place', 15]], doors: '20 h' },
    { off: [6, 14], t: 'Nuit des Saisons', sub: 'Soirée spéciale · trois salles, un seul billet', type: 'special', cap: 600, sold: 310, tiers: [['Prévente', 15], ['Sur place', 20]], doors: '22 h' }
  ].map(function (e, i) { e.date = nextDay(e.off[0], e.off[1]); e.id = i; return e; }).sort(function (a, b) { return a.date - b.date; });
  var MON = new Intl.DateTimeFormat('fr-FR', { month: 'short' }), LONG = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }), WD = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  var LABEL = { concert: 'Concert', club: 'Club', special: 'Soirée spéciale' };

  /* Prochain rendez-vous + bandeau */
  var n = EV[0]; $('#next').innerHTML = '<small>Prochaine date</small><b></b><span></span>'; $('#next b').textContent = n.t; $('#next span').textContent = cap(LONG.format(n.date)) + ' · ouverture ' + n.doors;
  var tick = $('#ticker'), items = EV.map(function (e) { return e.t + ' · ' + WD.format(e.date).replace('.', '') + ' ' + e.date.getDate() + ' ' + MON.format(e.date).replace('.', ''); });
  items.concat(items).concat(items).concat(items).forEach(function (t) { var s = document.createElement('span'); s.textContent = t; tick.append(s); });

  /* Agenda */
  var list = $('#events');
  EV.forEach(function (e, i) {
    var left = e.cap - e.sold, ratio = e.sold / e.cap, soldOut = left <= 0, low = !soldOut && left <= 80;
    var li = document.createElement('li'); li.className = 'ev rv'; li.dataset.type = e.type; li.dataset.d = String(Math.min(i, 4) * 60);
    li.innerHTML = '<div class="ev-date">' + '<span></span><b></b><span></span></div><div class="ev-main"><h3></h3><p></p></div><div class="ev-side"><span class="price tnum"></span><span class="left"></span><span class="meter"><i></i></span><button class="btn" type="button"></button></div>';
    var sp = $$('.ev-date span', li); sp[0].textContent = WD.format(e.date).replace('.', ''); $('.ev-date b', li).textContent = e.date.getDate(); sp[1].textContent = MON.format(e.date).replace('.', '');
    $('h3', li).textContent = e.t; $('.ev-main p', li).innerHTML = '<span class="tag ' + e.type + '">' + LABEL[e.type] + '</span>'; $('.ev-main p', li).append(document.createTextNode(e.sub + ' · ouverture ' + e.doors));
    $('.price', li).textContent = 'dès ' + eur(e.tiers[0][1]);
    var l = $('.left', li); l.textContent = soldOut ? 'Complet' : low ? 'Plus que ' + left + ' places' : left + ' places restantes'; if (low || soldOut) { l.classList.add('low'); $('.meter', li).classList.add('low'); }
    $('.meter i', li).style.setProperty('--p', String(ratio)); li.classList.add('has-meter');
    var b = $('.btn', li); b.textContent = soldOut ? 'Complet' : 'Billets'; b.disabled = soldOut; b.setAttribute('aria-label', (soldOut ? 'Complet : ' : 'Réserver des billets pour ') + e.t + ', ' + LONG.format(e.date));
    b.addEventListener('click', function () { openTk(e, b); }); list.append(li);
  });
  /* La jauge ne se remplit qu'une fois visible */
  $$('.meter i').forEach(function (i) { i.style.transform = D.calm ? '' : 'scaleX(0)'; });
  if (!D.calm && 'IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { var i = $('.meter i', x.target); i.style.transform = ''; io.unobserve(x.target); } }); }, { threshold: .4 }); $$('.ev', list).forEach(function (l) { io.observe(l); }); }
  $$('.filters button').forEach(function (b) { b.addEventListener('click', function () { $$('.filters button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); var shown = 0; $$('.ev', list).forEach(function (l) { var ok = b.dataset.f === 'all' || l.dataset.type === b.dataset.f; l.hidden = !ok; if (ok) { shown++; l.classList.add('in'); } }); $('#empty').hidden = shown > 0; }); });

  /* Ouvert maintenant ? */
  var op = $('#open'), h = new Date(), dow = h.getDay(), hr = h.getHours(), isOpen = ((dow === 4 || dow === 5) && (hr >= 20 || hr < 2)) || (dow === 6 && (hr >= 23 || hr < 5)) || ((dow === 5 || dow === 6) && hr < 2) || (dow === 0 && hr < 5);
  op.textContent = isOpen ? 'Ouvert ce soir' : 'Fermé en ce moment'; op.classList.toggle('closed', !isOpen);

  /* Billetterie */
  var tk = $('#tk'), cur, tier = 0, qty = 1, opener;
  function total() { $('#tk-tot').textContent = eur(cur.tiers[tier][1] * qty); }
  function openTk(e, from) {
    cur = e; tier = 0; qty = 1; opener = from; $('#tk-body').hidden = false; $('#tk-done').hidden = true; $('#tk-mail').value = ''; $('#tk-e').textContent = '';
    $('#tk-date').textContent = cap(LONG.format(e.date)) + ' · ouverture ' + e.doors; $('#tk-t').textContent = e.t; $('#q-o').textContent = 1;
    var box = $('#tk-types'); box.textContent = '';
    e.tiers.forEach(function (t, i) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(i === 0)); b.innerHTML = '<span></span><b class="tnum"></b>'; $('span', b).textContent = t[0]; $('b', b).textContent = eur(t[1]); b.addEventListener('click', function () { tier = i; $$('[role=radio]', box).forEach(function (x, k) { x.setAttribute('aria-checked', String(k === i)); }); total(); }); box.append(b); });
    total(); if (tk.showModal) tk.showModal(); else tk.setAttribute('open', '');
  }
  $('#q-m').addEventListener('click', function () { qty = Math.max(1, qty - 1); $('#q-o').textContent = qty; total(); });
  $('#q-p').addEventListener('click', function () { qty = Math.min(8, qty + 1); $('#q-o').textContent = qty; total(); });
  $('#tk-go').addEventListener('click', function () {
    var m = $('#tk-mail'); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m.value)) { $('#tk-e').textContent = 'Indiquez une adresse e-mail valide.'; m.setAttribute('aria-invalid', 'true'); m.focus(); return; }
    $('#tk-body').hidden = true; $('#tk-done').hidden = false; $('#tk-done-t').textContent = qty + ' place' + (qty > 1 ? 's' : '') + ' pour « ' + cur.t + ' », ' + LONG.format(cur.date) + '. (Démonstration : aucun billet réel.)';
  });
  tk.addEventListener('click', function (e) { if (e.target === tk) tk.close(); });
  tk.addEventListener('close', function () { if (opener) opener.focus(); });

  /* Privatisation */
  var rg = $('#pv-n'); rg.addEventListener('input', function () { $('#pv-o').textContent = rg.value + ' personnes'; });
  $('#pv-form').addEventListener('submit', function (e) {
    e.preventDefault(); var nm = $('#pv-name'), ml = $('#pv-mail'), ok = true; $('#pv-e1').textContent = $('#pv-e2').textContent = '';
    if (nm.value.trim().length < 2) { $('#pv-e1').textContent = 'Indiquez votre nom.'; ok = false; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ml.value)) { $('#pv-e2').textContent = 'Indiquez une adresse e-mail valide.'; ok = false; }
    if (ok) $('#pv-done').hidden = false;
  });
})();
