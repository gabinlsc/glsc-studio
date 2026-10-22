(function () {
  'use strict';
  var D = window.Demo, $ = D.$, $$ = D.$$;
  var PH = [
    { id: 'aube-ouessant', t: 'Aube sur la rade', p: 'Rade de Lorient, 6 h 42', f: ['mer', 'lumiere'], w: 1400, h: 933 },
    { id: 'brume-monts', t: 'Brume dans les monts', p: 'Monts d’Arrée, 7 h 15', f: ['terre'], w: 933, h: 1166 },
    { id: 'maree-basse', t: 'Marée basse', p: 'Baie d’Étel, 12 h 10', f: ['mer'], w: 1400, h: 933 },
    { id: 'dunes-pen-bron', t: 'Dunes de Pen-Bron', p: 'Presqu’île de Pen-Bron, 18 h 05', f: ['terre', 'lumiere'], w: 1400, h: 933 },
    { id: 'golfe-crepuscule', t: 'Crépuscule sur le golfe', p: 'Golfe du Morbihan, 21 h 02', f: ['mer', 'lumiere'], w: 933, h: 1166 },
    { id: 'lande-hiver', t: 'Lande en hiver', p: 'Cap Sizun, 8 h 30', f: ['terre'], w: 1400, h: 933 },
    { id: 'falaise-matin', t: 'Falaise, matin clair', p: 'Pointe du Raz, 7 h 55', f: ['mer', 'terre'], w: 1400, h: 933 },
    { id: 'ile-brehat', t: 'Île de Bréhat', p: 'Côtes-d’Armor, 19 h 20', f: ['mer'], w: 1400, h: 933 }
  ];
  var src = function (p) { return 'img/' + p.id + '.webp'; };
  var two = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ---------- Diaporama ---------- */
  var slides = $('#slides'), idx = 0, timer, DUR = 7000, paused = false, started = 0;
  PH.forEach(function (p, i) {
    var d = document.createElement('div'); d.className = 'slide' + (i === 0 ? ' on' : ''); d.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    var im = document.createElement('img'); im.src = src(p); im.alt = p.t + ' — ' + p.p + '. Illustration.'; im.width = p.w; im.height = p.h; if (i > 0) im.loading = 'lazy'; d.append(im); slides.append(d);
  });
  var bar = $('#bar'), anim;
  function go(n) {
    idx = (n + PH.length) % PH.length;
    $$('.slide', slides).forEach(function (s, i) { s.classList.toggle('on', i === idx); s.setAttribute('aria-hidden', String(i !== idx)); var im = $('img', s); im.style.animation = 'none'; void im.offsetWidth; im.style.animation = ''; });
    $('#cur').textContent = two(idx + 1); $('#caption').textContent = PH[idx].t + ' · ' + PH[idx].p;
    if (anim) anim.cancel();
    if (!D.calm) { anim = bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: DUR, fill: 'forwards' }); anim.onfinish = function () { if (!paused) go(idx + 1); }; if (paused) anim.pause(); }
    else bar.style.transform = 'scaleX(' + ((idx + 1) / PH.length) + ')';
  }
  $('#prev').addEventListener('click', function () { go(idx - 1); });
  $('#next').addEventListener('click', function () { go(idx + 1); });
  var stage = $('.stage');
  function pause(v) { paused = v; if (anim) v ? anim.pause() : anim.play(); }
  stage.addEventListener('mouseenter', function () { pause(true); }); stage.addEventListener('mouseleave', function () { pause(false); });
  stage.addEventListener('focusin', function () { pause(true); }); stage.addEventListener('focusout', function () { pause(false); });
  document.addEventListener('visibilitychange', function () { pause(document.hidden); });
  go(0);

  /* ---------- Galerie + filtre ---------- */
  var grid = $('#grid');
  PH.forEach(function (p, i) {
    var li = document.createElement('li'); li.className = 'tile rv'; li.dataset.f = p.f.join(' '); li.dataset.d = String((i % 3) * 90);
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Agrandir : ' + p.t);
    var im = document.createElement('img'); im.src = src(p); im.alt = ''; im.width = p.w; im.height = p.h; im.loading = 'lazy';
    var c = document.createElement('span'); c.className = 'cap'; var bt = document.createElement('b'); bt.textContent = p.t; c.append(bt, document.createTextNode(p.p));
    b.append(im, c); li.append(b); grid.append(li);
    b.addEventListener('click', function () { openLb(PH.indexOf(p), b); });
  });
  $$('.filters button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.filters button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      $$('.tile', grid).forEach(function (t) { var ok = b.dataset.f === 'all' || t.dataset.f.split(' ').indexOf(b.dataset.f) > -1; t.hidden = !ok; if (ok) t.classList.add('in'); });
    });
  });

  /* ---------- Visionneuse (élément <dialog> : focus piégé et Échap natifs) ---------- */
  var lb = $('#lb'), cur = 0, opener;
  function showLb(n) { cur = (n + PH.length) % PH.length; var p = PH[cur]; var im = $('#lb-img'); im.src = src(p); im.alt = p.t + '. Illustration.'; $('#lb-cap').textContent = p.t + ' · ' + p.p + ' — ' + two(cur + 1) + ' / ' + two(PH.length); }
  function openLb(n, from) { opener = from; showLb(n); if (lb.showModal) lb.showModal(); else lb.setAttribute('open', ''); $('#lb-x').focus(); }
  $('#lb-x').addEventListener('click', function () { lb.close(); });
  $('#lb-p').addEventListener('click', function () { showLb(cur - 1); }); $('#lb-nx').addEventListener('click', function () { showLb(cur + 1); });
  lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') showLb(cur - 1); if (e.key === 'ArrowRight') showLb(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('close', function () { if (opener) opener.focus(); });
  var x0 = null; lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) showLb(cur + (dx < 0 ? 1 : -1)); x0 = null; });

  /* ---------- Aperçu qui suit le curseur dans la liste des séries ---------- */
  var peek = $('#peek'), list = $('#s-list');
  if (matchMedia('(hover: hover)').matches && !D.calm) {
    peek.hidden = false;
    $$('a', list).forEach(function (a) {
      a.addEventListener('mouseenter', function () { peek.src = 'img/' + a.dataset.img + '.webp'; peek.classList.add('on'); });
      a.addEventListener('mouseleave', function () { peek.classList.remove('on'); });
    });
    list.addEventListener('mousemove', function (e) { peek.style.setProperty('--x', (e.clientX + 24) + 'px'); peek.style.setProperty('--y', (e.clientY - 100) + 'px'); });
  }

  /* ---------- Simulateur de tirages ---------- */
  var FORMATS = [['30 × 40 cm', 90], ['40 × 60 cm', 150], ['60 × 90 cm', 290]], FINS = [['Papier seul', 0], ['Cadre bois', 70], ['Dibond', 55]], f = 1, fin = 0;
  var sel = $('#t-img'), eur = function (n) { return n.toLocaleString('fr-FR') + ' €'; };
  PH.forEach(function (p, i) { var o = document.createElement('option'); o.value = i; o.textContent = p.t; sel.append(o); });
  function opts(box, arr, get, set) { arr.forEach(function (a, i) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(i === get())); b.textContent = a[0]; b.addEventListener('click', function () { set(i); $$('[role=radio]', box).forEach(function (x, k) { x.setAttribute('aria-checked', String(k === i)); }); sum(); }); box.append(b); }); }
  opts($('#t-fmt'), FORMATS, function () { return f; }, function (i) { f = i; });
  opts($('#t-fin'), FINS, function () { return fin; }, function (i) { fin = i; });
  function sum() {
    var p = PH[sel.value]; $('#t-pic').src = src(p); $('#t-pic').alt = p.t + '. Illustration.';
    $('#t-frame').className = 't-frame' + (fin === 1 ? ' cadre' : fin === 2 ? ' dibond' : '');
    $('#t-l1').textContent = p.t + ' · ' + FORMATS[f][0]; $('#t-p1').textContent = eur(FORMATS[f][1]);
    $('#t-l2').textContent = FINS[fin][0]; $('#t-p2').textContent = FINS[fin][1] ? eur(FINS[fin][1] * (f + 1) / 2 | 0 || FINS[fin][1]) : 'Inclus';
    var extra = FINS[fin][1] ? (FINS[fin][1] * (f + 1) / 2 | 0 || FINS[fin][1]) : 0;
    $('#t-tot').textContent = eur(FORMATS[f][1] + extra);
  }
  sel.addEventListener('change', sum); sum();
  $('#t-cta').addEventListener('click', function () { $('#c-msg').value = 'Bonjour, je souhaite le tirage « ' + PH[sel.value].t + ' » en ' + FORMATS[f][0] + ', finition : ' + FINS[fin][0].toLowerCase() + '.'; });

  /* ---------- Contact (démonstration) ---------- */
  $('#c-form').addEventListener('submit', function (e) {
    e.preventDefault(); var n = $('#c-name'), m = $('#c-mail'), ok = true; $('#c-e1').textContent = $('#c-e2').textContent = '';
    if (n.value.trim().length < 2) { $('#c-e1').textContent = 'Indiquez votre nom.'; ok = false; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m.value)) { $('#c-e2').textContent = 'Indiquez une adresse e-mail valide.'; ok = false; }
    if (!ok) return; $('#c-form').hidden = true; $('#c-done').hidden = false;
  });
})();
