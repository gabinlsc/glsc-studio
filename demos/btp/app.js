(function () {
  'use strict';
  var D = window.Demo, $ = D.$, $$ = D.$$, NS = 'http://www.w3.org/2000/svg';
  var eur = function (n) { return (Math.round(n / 50) * 50).toLocaleString('fr-FR') + ' €'; };

  /* ---------- Façade dessinée : trois états (avant, après) ---------- */
  function facade(state) {
    var A = state === 'after';
    var c = A ? { sky: '#cfe0e8', ground: '#8fa38f', wall: '#ece6d8', roof: '#37444d', trim: '#ffffff', shut: '#3f5d6e', door: '#2e4a3f', chim: '#d9d1be' } : { sky: '#cdd3d4', ground: '#7c7f6c', wall: '#b9ad98', roof: '#76705f', trim: '#cfc7b4', shut: '#8a7f6a', door: '#66503c', chim: '#9d917c' };
    var s = '<svg viewBox="0 0 600 380" xmlns="' + NS + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
    s += '<rect width="600" height="380" fill="' + c.sky + '"/>';
    s += '<rect y="320" width="600" height="60" fill="' + c.ground + '"/>';
    s += '<rect x="395" y="70" width="34" height="80" fill="' + c.chim + '"/><rect x="391" y="64" width="42" height="9" fill="' + c.roof + '"/>';
    s += '<polygon points="70,170 300,52 530,170" fill="' + c.roof + '"/>';
    if (!A) s += '<polygon points="70,170 300,52 530,170" fill="#000" opacity=".08"/><path d="M130 150l30-18M300 90l36 20M440 140l30 10" stroke="#9a9078" stroke-width="3" opacity=".6"/>';
    s += '<rect x="90" y="170" width="420" height="152" fill="' + c.wall + '"/>';
    if (!A) s += '<rect x="90" y="170" width="420" height="152" fill="#3d3a30" opacity=".05"/><path d="M120 170l10 90M250 170l-8 110M430 170l12 70" stroke="#6b6350" stroke-width="14" opacity=".13"/><path d="M90 300h420" stroke="#5b5642" stroke-width="22" opacity=".16"/><path d="M180 205l22 30M360 250l30 20" stroke="#4d4837" stroke-width="2" opacity=".5"/>';
    else s += '<rect x="90" y="316" width="420" height="6" fill="#c9c2af"/><rect x="82" y="166" width="436" height="6" fill="#fff" opacity=".6"/><path d="M510 172v150" stroke="#9fa7a8" stroke-width="5"/>';
    [[130, 195], [378, 195]].forEach(function (p) {
      var x = p[0], y = p[1];
      s += '<rect x="' + (x - 22) + '" y="' + y + '" width="22" height="66" fill="' + c.shut + '"/><rect x="' + (x + 76) + '" y="' + y + '" width="22" height="66" fill="' + c.shut + '"/>';
      s += '<rect x="' + x + '" y="' + y + '" width="76" height="66" fill="' + c.trim + '"/><rect x="' + (x + 6) + '" y="' + (y + 6) + '" width="64" height="54" fill="' + (A ? '#a9c5d3' : '#6c7b82') + '"/><path d="M' + (x + 38) + ' ' + (y + 6) + 'v54M' + (x + 6) + ' ' + (y + 33) + 'h64" stroke="' + c.trim + '" stroke-width="3"/>';
      if (A) s += '<path d="M' + (x + 8) + ' ' + (y + 14) + 'l18 -6" stroke="#fff" opacity=".7" stroke-width="3"/>';
      s += '<rect x="' + (x - 6) + '" y="' + (y + 66) + '" width="88" height="6" fill="' + (A ? '#fff' : '#9d917c') + '"/>';
    });
    s += '<rect x="262" y="228" width="76" height="94" fill="' + c.door + '"/><rect x="272" y="238" width="22" height="34" fill="#000" opacity=".12"/><rect x="306" y="238" width="22" height="34" fill="#000" opacity=".12"/><circle cx="324" cy="280" r="3.200" fill="' + (A ? '#d6b25a' : '#4a4030') + '"/>';
    s += '<rect x="256" y="320" width="88" height="6" fill="' + (A ? '#d8d2c0' : '#7e7560') + '"/>';
    s += '</svg>'; return s;
  }
  $('#ba-after').innerHTML = facade('after'); $('#ba-before').innerHTML = facade('before');
  var stage = $('#ba'), range = $('#ba-range');
  function setPos(v) { stage.style.setProperty('--pos', v + '%'); range.setAttribute('aria-valuetext', Math.round(v) + ' % après'); }
  range.addEventListener('input', function () { setPos(range.value); }); setPos(50);
  /* Petite démonstration au premier passage */
  if (!D.calm && 'IntersectionObserver' in window) {
    var once = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) return; once.disconnect(); var t0 = performance.now(); (function f(t) { var p = Math.min(1, (t - t0) / 1600); var v = 50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p); if (!touched) { range.value = v; setPos(v); } if (p < 1 && !touched) requestAnimationFrame(f); })(t0); }, { threshold: .6 });
    var touched = false; ['pointerdown', 'keydown'].forEach(function (e) { range.addEventListener(e, function () { touched = true; }); }); once.observe(stage);
  }

  /* ---------- Dessin d'en-tête (tracé progressif) ---------- */
  var hs = $('#hero-svg'), P = [
    ['M60 380H540', 0, 600, ''], ['M100 380V190L300 70l200 120v190', .2, 900, ''], ['M80 200L300 66l220 134', .5, 700, 'acc'],
    ['M130 240h70v70h-70zM400 240h70v70h-70zM260 290h80v90h-80z', .9, 700, ''], ['M165 240v70M130 275h70M435 240v70M400 275h70', 1.3, 300, 'thin'],
    ['M40 380V120M40 150h40M40 220h40M40 290h40M560 380V120M560 150h-40M560 220h-40M560 290h-40M40 120h520', 1.1, 1400, 'thin acc']
  ];
  P.forEach(function (p) { var e = document.createElementNS(NS, 'path'); e.setAttribute('d', p[0]); e.setAttribute('class', 'draw ' + p[3]); e.style.setProperty('--len', p[2]); e.style.setProperty('--dl', p[1] + 's'); e.setAttribute('pathLength', p[2]); hs.append(e); });
  var f = document.createElementNS(NS, 'polygon'); f.setAttribute('points', '100,190 300,70 500,190'); f.setAttribute('class', 'fill'); hs.append(f);
  if (D.calm) $$('.draw', hs).forEach(function (e) { e.style.animation = 'none'; e.style.strokeDashoffset = 0; });

  /* ---------- Estimateur ---------- */
  var TYPES = [
    ['Isolation des combles', 35, 0, 'm²', 'Isolation soufflée ou en rouleaux, pare-vapeur inclus.', ['Diagnostic préalable', 'Matériaux et pose', 'Évacuation des gravats']],
    ['Fenêtres et portes', 480, 150, 'unité', 'Dépose, pose en rénovation, finitions intérieures.', ['Fourniture et pose', 'Joints et finitions', 'Reprise des enduits']],
    ['Salle de bain', 800, 1800, 'm²', 'Dépose, plomberie, étanchéité, carrelage, équipements.', ['Démolition et évacuation', 'Plomberie, électricité', 'Carrelage et équipements']],
    ['Extension', 2200, 6000, 'm²', 'Étude, fondations, gros œuvre, charpente, finitions.', ['Étude et permis', 'Gros œuvre et toiture', 'Isolation et finitions']]
  ], FIN = [['Essentielle', 1], ['Confort', 1.28], ['Premium', 1.65]], ti = 0, fi = 1, S = $('#e-s');
  function opts(box, arr, get, set) { arr.forEach(function (a, i) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(i === get())); b.textContent = a[0]; b.addEventListener('click', function () { set(i); $$('[role=radio]', box).forEach(function (x, k) { x.setAttribute('aria-checked', String(k === i)); }); calc(); }); box.append(b); }); }
  opts($('#e-type'), TYPES, function () { return ti; }, function (i) { ti = i; if (i === 1) { S.min = 1; S.max = 15; S.step = 1; S.value = 6; } else { S.min = 5; S.max = i === 0 ? 150 : i === 2 ? 20 : 80; S.step = i === 2 ? 1 : 5; S.value = i === 0 ? 50 : i === 2 ? 6 : 25; } });
  opts($('#e-fin'), FIN, function () { return fi; }, function (i) { fi = i; });
  function calc() {
    var t = TYPES[ti], n = +S.value, unit = ti === 1 ? ' fenêtre' + (n > 1 ? 's' : '') : ' m²'; $('#e-so').textContent = n + unit;
    var base = (t[2] + t[1] * n) * FIN[fi][1], lo = base * .9, hi = base * 1.18;
    $('#e-v').textContent = eur(lo) + ' – ' + eur(hi); $('#e-d').textContent = t[4];
    var pts = $('#e-pts'); pts.textContent = ''; t[5].forEach(function (p, k) { var li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('span'); a.textContent = p; b.textContent = ['≈ 25 %', '≈ 55 %', '≈ 20 %'][k]; b.className = 'tnum'; li.append(a, b); pts.append(li); });
  }
  S.addEventListener('input', calc); calc();
  $('#e-go').addEventListener('click', function () { $('#d-msg').value = 'Projet : ' + TYPES[ti][0].toLowerCase() + ', ' + $('#e-so').textContent + ', finition ' + FIN[fi][0].toLowerCase() + '. Estimation affichée : ' + $('#e-v').textContent + '.'; });

  /* ---------- Fil de la méthode qui se remplit au scroll ---------- */
  var steps = $('#steps');
  if (!D.calm) { var tick = false; var upd = function () { tick = false; var r = steps.getBoundingClientRect(), vh = innerHeight, p = (vh * .62 - r.top) / r.height; steps.style.setProperty('--fill', Math.max(0, Math.min(1, p)) * 100 + '%'); }; addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); upd(); }
  else steps.style.setProperty('--fill', '100%');

  /* ---------- Devis (démonstration) ---------- */
  $('#dv-form').addEventListener('submit', function (e) {
    e.preventDefault(); var n = $('#d-name'), c = $('#d-contact'), ok = true; $('#d-e1').textContent = $('#d-e2').textContent = '';
    if (n.value.trim().length < 2) { $('#d-e1').textContent = 'Indiquez votre nom.'; ok = false; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.value.trim()) && c.value.replace(/\D/g, '').length < 10) { $('#d-e2').textContent = 'Indiquez un e-mail valide ou un numéro à 10 chiffres.'; ok = false; }
    if (ok) { $('#d-done').hidden = false; }
  });
})();
