(function () {
  'use strict';
  var D = window.Demo, $ = D.$, $$ = D.$$;

  /* ---------- Nuancier ---------- */
  var SHADES = [
    { n: 'Châtain profond', c: '#4a3226', tech: 'Couleur complète', d: 'Une base riche et brillante, idéale pour couvrir les premiers cheveux blancs sans effet de masque.', t: '2 h', p: '68 €', care: 'Toutes les 6 semaines' },
    { n: 'Caramel', c: '#9a6535', tech: 'Balayage', d: 'Des reflets chauds posés à la main, qui éclaircissent le regard et grandissent naturellement.', t: '3 h', p: '95 €', care: 'Tous les 3 mois' },
    { n: 'Blond miel', c: '#c39a5b', tech: 'Balayage + patine', d: 'Un blond doré, lumineux sans être jaune. La patine corrige la nuance à chaque visite.', t: '3 h 30', p: '127 €', care: 'Tous les 2 à 3 mois' },
    { n: 'Blond cendré', c: '#b4aa98', tech: 'Décoloration + gloss', d: 'Un blond froid et doux. Demande du soin : nous préparons la fibre avant de décolorer.', t: '4 h', p: '150 €', care: 'Toutes les 8 semaines' },
    { n: 'Cuivre', c: '#a4502d', tech: 'Couleur complète', d: 'Un roux franc et vibrant. Nous utilisons des pigments qui tiennent mieux au lavage.', t: '2 h 30', p: '74 €', care: 'Gloss tous les mois' },
    { n: 'Rouge acajou', c: '#6d2c2e', tech: 'Couleur + gloss', d: 'Des reflets profonds, entre le prune et le bordeaux. Très flatteur sur peau claire.', t: '2 h 30', p: '82 €', care: 'Toutes les 6 semaines' },
    { n: 'Noir bleuté', c: '#1f2229', tech: 'Couleur complète', d: 'Un noir intense avec un reflet froid. Brillance maximale, brillance du verre.', t: '1 h 45', p: '68 €', care: 'Toutes les 6 semaines' },
    { n: 'Poivre & sel', c: '#8f8d8a', tech: 'Patine sur cheveux blancs', d: 'On valorise le blanc plutôt que de le cacher : une patine argent qui évite le jaunissement.', t: '1 h 15', p: '49 €', care: 'Tous les 2 mois' }
  ];
  var box = $('#swatches'), card = $('#nu-card'), current = -1;
  function locks(color) {
    var g = $('#locks'); g.textContent = ''; var NS = 'http://www.w3.org/2000/svg', n = 22;
    for (var i = 0; i < n; i++) {
      var p = document.createElementNS(NS, 'path'), x = 20 + i * (560 / n), a = 40 + (i % 5) * 14;
      p.setAttribute('d', 'M' + x + ' -20 C ' + (x + a) + ' 160, ' + (x - a) + ' 360, ' + (x + a * .6) + ' 520 S ' + (x - a * .3) + ' 660, ' + (x + a * .5) + ' 740');
      p.setAttribute('stroke-width', (1.2 + (i % 4) * .7).toFixed(1)); p.style.animationDelay = (i * 38) + 'ms'; p.style.opacity = (0.35 + (i % 6) * .11).toFixed(2); g.append(p);
    }
  }
  function pick(i, animate) {
    if (i === current) return; current = i; var s = SHADES[i];
    $$('.sw-btn', box).forEach(function (b, k) { b.setAttribute('aria-checked', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
    card.style.setProperty('--tone', s.c);
    $('#nu-tech').textContent = s.tech; $('#nu-name').textContent = s.n; $('#nu-desc').textContent = s.d; $('#nu-time').textContent = s.t; $('#nu-price').textContent = s.p; $('#nu-care').textContent = s.care;
    if (animate && !D.calm) { card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap'); }
    locks(s.c);
  }
  SHADES.forEach(function (s, i) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'sw-btn'; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', s.n); b.setAttribute('aria-checked', 'false'); b.title = s.n; b.style.setProperty('--c', s.c);
    b.addEventListener('click', function () { pick(i, true); });
    b.addEventListener('keydown', function (e) { var k = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0; if (!k) return; e.preventDefault(); var n = (i + k + SHADES.length) % SHADES.length; pick(n, true); $$('.sw-btn', box)[n].focus(); });
    box.append(b);
  });
  pick(1, false);

  /* ---------- Accordéon ---------- */
  $$('.acc-item button').forEach(function (b) { b.addEventListener('click', function () { b.setAttribute('aria-expanded', String(b.getAttribute('aria-expanded') !== 'true')); }); });

  /* ---------- Avis ---------- */
  var qs = $$('.q'), dots = $('#q-dots'), qi = 0, timer;
  qs.forEach(function (_, i) { var d = document.createElement('button'); d.type = 'button'; d.setAttribute('role', 'tab'); d.setAttribute('aria-label', 'Avis ' + (i + 1)); d.setAttribute('aria-selected', String(i === 0)); d.addEventListener('click', function () { show(i); restart(); }); dots.append(d); });
  function show(i) { qi = i; qs.forEach(function (q, k) { q.classList.toggle('on', k === i); }); $$('button', dots).forEach(function (d, k) { d.setAttribute('aria-selected', String(k === i)); }); }
  function restart() { clearInterval(timer); if (!D.calm) timer = setInterval(function () { show((qi + 1) % qs.length); }, 6500); }
  restart();

  /* ---------- Rendez-vous ---------- */
  var presta = $('#r-presta'), daysBox = $('#r-days'), timesBox = $('#r-times'), day = 0, time = null, now = new Date(), days = [];
  var wd = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }), long = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  for (var i = 0; i < 14 && days.length < 7; i++) { var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); if (d.getDay() !== 0 && d.getDay() !== 1) days.push(d); }
  function radio(group, sel) { $$('[role=radio]', group).forEach(function (b) { b.setAttribute('aria-checked', String(b === sel)); }); }
  $$('[role=radio]', presta).forEach(function (b) { b.addEventListener('click', function () { radio(presta, b); times(); summary(); }); });
  days.forEach(function (d, i) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(i === 0)); b.setAttribute('aria-label', long.format(d)); var s = document.createElement('small'), n = document.createElement('b'); s.textContent = wd.format(d).replace('.', ''); n.textContent = d.getDate(); b.append(s, n); b.addEventListener('click', function () { day = i; radio(daysBox, b); times(); summary(); }); daysBox.append(b); });
  function rnd(a, b, c) { return ((a * 73 + b * 19 + c * 7) * 2654435761 % 1000) / 1000; }
  function times() {
    timesBox.textContent = ''; time = null; var d = days[day], dur = $('[aria-checked=true]', presta).dataset.t, last = d.getDay() === 6 ? 17 : 19, need = dur.indexOf('h') > -1 ? parseInt(dur, 10) : 0.5;
    for (var h = 9; h + need <= last; h += 0.5) {
      var label = Math.floor(h) + ' h' + (h % 1 ? '30' : '00'), past = d.toDateString() === now.toDateString() && h <= now.getHours() + now.getMinutes() / 60 + 1, taken = past || rnd(d.getDate(), h * 2, need * 2) > .6;
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false'); b.textContent = label; b.disabled = taken; if (taken) b.setAttribute('aria-label', label + ', indisponible');
      b.addEventListener('click', function (lab) { return function (e) { time = lab; radio(timesBox, e.currentTarget); summary(); }; }(label)); timesBox.append(b);
    }
    if (!timesBox.children.length) timesBox.textContent = 'Plus de créneau ce jour-là pour cette durée.';
  }
  function summary() { var p = $('[aria-checked=true]', presta); $('#r-sum').textContent = time ? p.dataset.v + ' · ' + long.format(days[day]) + ' à ' + time : ''; }
  times();
  $('#rdv-form').addEventListener('submit', function (e) {
    e.preventDefault(); var name = $('#r-name'), tel = $('#r-tel'), ok = true;
    [name, tel].forEach(function (x) { x.removeAttribute('aria-invalid'); }); $('#e-name').textContent = $('#e-tel').textContent = '';
    if (!time) { $('#r-sum').textContent = 'Choisissez une heure pour continuer.'; timesBox.scrollIntoView({ block: 'center' }); return; }
    if (name.value.trim().length < 2) { name.setAttribute('aria-invalid', 'true'); $('#e-name').textContent = 'Indiquez votre nom.'; ok = false; }
    if (tel.value.replace(/\D/g, '').length < 10) { tel.setAttribute('aria-invalid', 'true'); $('#e-tel').textContent = 'Indiquez un numéro à 10 chiffres.'; if (ok) tel.focus(); ok = false; } else if (!ok) name.focus();
    if (!ok) return;
    $('#rdv-form').hidden = true; $('#r-done').hidden = false; $('#r-done-t').textContent = name.value.trim() + ', rendez-vous noté : ' + $('#r-sum').textContent + '. (Démonstration : rien n’a été envoyé.)';
  });
  $('#r-again').addEventListener('click', function () { $('#r-done').hidden = true; $('#rdv-form').hidden = false; $('#rdv-form').reset(); time = null; times(); summary(); });
})();
