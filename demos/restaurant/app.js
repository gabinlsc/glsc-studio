(function () {
  'use strict';
  var D = window.Demo, $ = D.$, $$ = D.$$;
  var DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  // [déjeuner début, fin, dîner début, fin] en heures ; null = fermé
  var HOURS = { 0: [[12, 14]], 1: null, 2: [[12, 14], [19, 22]], 3: [[12, 14], [19, 22]], 4: [[12, 14], [19, 22]], 5: [[12, 14], [19, 22]], 6: [[12, 14], [19, 22]] };

  /* ---------- Ouvert / fermé, calculé sur l'heure du visiteur ---------- */
  function status(now) {
    var day = now.getDay(), h = now.getHours() + now.getMinutes() / 60, slots = HOURS[day] || [];
    for (var i = 0; i < slots.length; i++) if (h >= slots[i][0] && h < slots[i][1]) return { open: true, text: 'Ouvert · jusqu’à ' + slots[i][1] + ' h' };
    for (var j = 0; j < slots.length; j++) if (h < slots[j][0]) return { open: false, text: 'Fermé · ouvre à ' + slots[j][0] + ' h' };
    for (var k = 1; k <= 7; k++) { var d = (day + k) % 7; if (HOURS[d]) return { open: false, text: 'Fermé · ouvre ' + (k === 1 ? 'demain' : DAYS[d]) + ' à ' + HOURS[d][0][0] + ' h' }; }
    return { open: false, text: 'Fermé' };
  }
  var pill = $('#open-pill'), st = status(new Date());
  pill.classList.toggle('is-open', st.open); $('span', pill).textContent = st.text;
  var row = $('#hours li[data-d="' + new Date().getDay() + '"]'); if (row) row.classList.add('today-row');

  /* ---------- Carte : onglets + filtres ---------- */
  var items = $$('#menu li'), tabs = $$('.tabs button'), chips = $$('.chip'), cat = 'entrees', active = {};
  function apply() {
    var shown = 0;
    items.forEach(function (li) {
      var tags = li.dataset.tags.split(' ');
      var ok = li.dataset.cat === cat && Object.keys(active).every(function (t) { return !active[t] || tags.indexOf(t) > -1; });
      li.hidden = !ok; if (ok) { shown++; li.classList.add('out'); (function (el, n) { setTimeout(function () { el.classList.remove('out'); }, 30 + n * 55); })(li, shown); }
    });
    $('#empty').hidden = shown > 0;
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { cat = t.dataset.cat; tabs.forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); }); apply(); }); });
  chips.forEach(function (c) { c.addEventListener('click', function () { var on = c.getAttribute('aria-pressed') !== 'true'; c.setAttribute('aria-pressed', String(on)); active[c.dataset.tag] = on; apply(); }); });
  apply();

  /* ---------- Réservation en trois étapes ---------- */
  var step = 1, guests = 2, chosen = null;
  var sel = $('#res-date'), now = new Date();
  var fmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  var dates = [];
  for (var i = 0; i < 21 && dates.length < 14; i++) { var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); if (HOURS[d.getDay()]) dates.push(d); }
  dates.forEach(function (d, i) { var o = document.createElement('option'); o.value = i; o.textContent = cap(fmt.format(d)); sel.append(o); });
  function seed(date, h, m) { var s = date.getDate() * 31 + date.getMonth() * 7 + h * 13 + m; return (s * 2654435761 % 100) / 100; }
  function slotsFor(date) {
    var out = [], rules = HOURS[date.getDay()], today = date.toDateString() === now.toDateString();
    rules.forEach(function (r) { for (var h = r[0]; h < r[1] - (r[1] === 14 ? 0.5 : 1); h += 0.5) { var hh = Math.floor(h), mm = (h % 1) * 60; var past = today && (hh + mm / 60) <= now.getHours() + now.getMinutes() / 60 + 0.5; out.push({ label: hh + ' h' + (mm ? '30' : '00'), full: past || seed(date, hh, mm) > 0.62 - (guests > 4 ? 0.2 : 0) }); } });
    return out;
  }
  function renderSlots() {
    var date = dates[sel.value], box = $('#slots'); box.textContent = ''; chosen = null;
    slotsFor(date).forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'slot'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false'); b.textContent = s.label; b.disabled = s.full;
      if (s.full) b.setAttribute('aria-label', s.label + ', complet');
      b.addEventListener('click', function () { $$('.slot', box).forEach(function (x) { x.setAttribute('aria-checked', 'false'); }); b.setAttribute('aria-checked', 'true'); chosen = s.label; $('#res-next').disabled = false; });
      box.append(b);
    });
    $('#slots-hint').textContent = cap(fmt.format(date)) + ' · ' + guests + ' personne' + (guests > 1 ? 's' : '') + '. Les horaires barrés sont complets.';
  }
  function show(n) {
    step = n;
    $$('.step').forEach(function (s) { s.hidden = +s.dataset.step !== n; });
    $$('.stepper li').forEach(function (li) { var k = +li.dataset.s; li.classList.toggle('on', k === n); li.classList.toggle('done', k < n); });
    $('#res-back').hidden = n === 1;
    var next = $('#res-next'); next.textContent = n === 1 ? 'Choisir l’heure' : n === 2 ? 'Continuer' : 'Confirmer la réservation'; next.disabled = n === 2 && !chosen;
    if (n === 2) renderSlots();
    if (n === 3) $('#recap').textContent = cap(fmt.format(dates[sel.value])) + ' à ' + chosen + ' · ' + guests + ' personne' + (guests > 1 ? 's' : '');
  }
  $('#g-minus').addEventListener('click', function () { guests = Math.max(1, guests - 1); $('#g-out').textContent = guests; });
  $('#g-plus').addEventListener('click', function () { guests = Math.min(8, guests + 1); $('#g-out').textContent = guests; });
  $('#res-back').addEventListener('click', function () { show(step - 1); });
  $('#res-next').addEventListener('click', function () {
    if (step < 3) { show(step + 1); return; }
    var name = $('#res-name'), tel = $('#res-tel'), ok = true;
    var bad = function (el, id, msg) { el.setAttribute('aria-invalid', 'true'); $(id).textContent = msg; ok = false; };
    [name, tel].forEach(function (el) { el.removeAttribute('aria-invalid'); }); $('#err-name').textContent = ''; $('#err-tel').textContent = '';
    if (name.value.trim().length < 2) bad(name, '#err-name', 'Indiquez votre nom.');
    if (tel.value.replace(/\D/g, '').length < 10) bad(tel, '#err-tel', 'Indiquez un numéro à 10 chiffres.');
    if (!ok) { (name.getAttribute('aria-invalid') ? name : tel).focus(); return; }
    $('#res-form').hidden = true; $('#res-done').hidden = false;
    $('#done-text').textContent = name.value.trim() + ', nous vous attendons ' + $('#recap').textContent.toLowerCase() + '. (Démonstration : rien n’a été envoyé.)';
  });
  $('#res-again').addEventListener('click', function () { $('#res-done').hidden = true; $('#res-form').hidden = false; $('#res-form').reset(); guests = 2; $('#g-out').textContent = 2; show(1); });
  show(1);
})();
