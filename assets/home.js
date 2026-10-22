/* StudioGLSC — comportement propre à la page d'accueil (formulaire, estimation, démos, FAQ…). Charge après studio.js. */
(function () {
  'use strict';
  var C = window.StudioCfg, $ = C.$, $$ = C.$$, reduceMotion = C.reduceMotion;
  var BOOKING_URL = C.BOOKING_URL, REPLY_DELAY = C.REPLY_DELAY, CONTACT_ENDPOINT = C.CONTACT_ENDPOINT;

  /* ---------- Lien actif dans la navigation ---------- */
  var links = $$('#desktop-nav a.nav-link').filter(function (l) { return l.hash; }).concat($$('#rail a'));
  if ('IntersectionObserver' in window && links.length) {
    var byId = {};
    links.forEach(function (l) { (byId[l.hash.slice(1)] = byId[l.hash.slice(1)] || []).push(l); });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.removeAttribute('aria-current'); });
        (byId[en.target.id] || []).forEach(function (l) { l.setAttribute('aria-current', 'location'); });
      });
    }, { rootMargin: '-25% 0px -60% 0px' });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Phrase qui change dans le héros ---------- */
  var rotator = $('.hero-rotator');
  var phrases = ['Fait pour vos clients', 'Pensé pour le mobile', 'Simple à faire évoluer'];
  if (!reduceMotion && rotator) {
    var n = 0;
    setInterval(function () {
      n = (n + 1) % phrases.length;
      rotator.classList.remove('changing');
      void rotator.offsetWidth;
      rotator.textContent = phrases[n];
      rotator.classList.add('changing');
    }, 3200);
  }

  /* ---------- FAQ : ouverture animée ---------- */
  $$('.faq-list details').forEach(function (d) {
    var summary = $('summary', d);
    var answer = $('p', d);
    summary.addEventListener('click', function (e) {
      if (reduceMotion) return;
      e.preventDefault();
      if (d.open) {
        var out = answer.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 180, easing: 'ease-in' });
        out.onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        answer.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    });
  });

  /* ---------- Formulaire en quatre étapes ---------- */
  var form = $('#contact-form');
  var panes = $$('.step-pane', form);
  var stepNow = 0;
  var btnBack = $('#step-back'), btnNext = $('#step-next'), btnSend = $('#step-send');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function showError(key, message) {
    var box = $('[data-error="' + key + '"]', form);
    if (box) box.textContent = message || '';
    var field = form.elements[key];
    if (field && field.nodeType === 1) { if (message) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid'); }
  }
  function validateStep(i) {
    var pane = panes[i], ok = true, first = null;
    $$('input[type=radio]', pane).forEach(function (r) { r.name; });
    var names = {};
    $$('input[type=radio]', pane).forEach(function (r) { names[r.name] = true; });
    Object.keys(names).forEach(function (n) {
      if (!form.querySelector('input[name="' + n + '"]:checked')) { showError(n, 'Choisissez une option pour continuer.'); ok = false; first = first || $('input[name="' + n + '"]', pane); }
      else showError(n, '');
    });
    if (pane.dataset.step === '4') {
      var name = form.elements.name.value.trim(), email = form.elements.email.value.trim();
      if (!name) { showError('name', 'Indiquez votre nom.'); ok = false; first = first || form.elements.name; } else showError('name', '');
      if (!email) { showError('email', 'Indiquez votre adresse e-mail.'); ok = false; first = first || form.elements.email; }
      else if (!EMAIL_RE.test(email)) { showError('email', 'Cette adresse e-mail ne semble pas valide (exemple : nom@domaine.fr).'); ok = false; first = first || form.elements.email; }
      else showError('email', '');
    }
    if (!ok && first) first.focus();
    return ok;
  }
  function goStep(i, focus) {
    stepNow = Math.max(0, Math.min(panes.length - 1, i));
    panes.forEach(function (p, k) { p.classList.toggle('is-active', k === stepNow); });
    $('#step-label').textContent = 'Étape ' + (stepNow + 1) + ' sur ' + panes.length;
    $('#step-bar').style.width = (stepNow + 1) / panes.length * 100 + '%';
    btnBack.hidden = stepNow === 0;
    btnNext.hidden = stepNow === panes.length - 1;
    btnSend.hidden = stepNow !== panes.length - 1;
    if (focus) { var f = $('input, textarea', panes[stepNow]); if (f) f.focus({ preventScroll: true }); }
  }
  btnNext.addEventListener('click', function () { if (validateStep(stepNow)) goStep(stepNow + 1, true); });
  btnBack.addEventListener('click', function () { goStep(stepNow - 1, true); });
  // Choisir une option efface l'erreur ; sur les étapes à choix unique, Entrée avance.
  form.addEventListener('change', function (e) { if (e.target.type === 'radio') showError(e.target.name, ''); });
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && stepNow < panes.length - 1) { e.preventDefault(); btnNext.click(); }
  });
  goStep(0, false);

  function buildMessage(f) {
    var lines = ['Bonjour Gabin,', ''];
    var msg = String(f.get('message') || '').trim();
    if (msg) lines.push(msg, '');
    lines.push('Activité : ' + f.get('activity'), 'Besoin : ' + f.get('service'), 'Délai souhaité : ' + f.get('timing'), '', 'Nom : ' + String(f.get('name')).trim(), 'E-mail : ' + String(f.get('email')).trim());
    var phone = String(f.get('phone') || '').trim();
    if (phone) lines.push('Téléphone : ' + phone);
    return lines.join('\n');
  }
  function showDone(f, viaMail, message) {
    var first = String(f.get('name')).trim().split(/\s+/)[0];
    $('#done-title').textContent = 'Merci ' + first + ' !';
    $('#done-text').textContent = viaMail
      ? 'Votre application de messagerie va s’ouvrir avec le message préparé : il ne reste qu’à l’envoyer pour finaliser votre demande.'
      : 'Votre demande est bien arrivée. ' + (REPLY_DELAY ? 'Je vous réponds ' + REPLY_DELAY + '.' : 'Je vous réponds directement.');
    var fb = $('#done-fallback');
    fb.hidden = !viaMail;
    if (viaMail) $('#done-copy').value = 'À : pro@glsc.fr\nObjet : Demande de contact StudioGLSC — ' + f.get('service') + '\n\n' + message;
    form.hidden = true;
    var done = $('#form-done');
    done.hidden = false;
    done.focus({ preventScroll: true });
    done.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function resetForm() {
    form.reset(); $$('[aria-invalid]', form).forEach(function (e) { e.removeAttribute('aria-invalid'); });
    $$('.field-error', form).forEach(function (e) { e.textContent = ''; });
    $('#form-status').textContent = '';
    $('#form-done').hidden = true; form.hidden = false; goStep(0, true);
  }
  $('#done-restart').addEventListener('click', resetForm);
  $('#done-copy-btn').addEventListener('click', function () {
    var box = $('#done-copy'), btn = this;
    box.select();
    (navigator.clipboard ? navigator.clipboard.writeText(box.value) : Promise.reject()).then(function () { btn.textContent = 'Message copié ✓'; }, function () { document.execCommand && document.execCommand('copy'); btn.textContent = 'Message copié ✓'; });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (stepNow < panes.length - 1) { btnNext.click(); return; }
    if (!validateStep(stepNow)) return;
    var f = new FormData(form);
    if (String(f.get('website') || '')) return; // champ piège : un robot l'a rempli
    var message = buildMessage(f);
    var mailto = function () {
      var subject = 'Demande de contact StudioGLSC — ' + f.get('service');
      showDone(f, true, message);
      window.location.href = 'mailto:pro@glsc.fr?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message);
    };
    if (!CONTACT_ENDPOINT) { mailto(); return; }
    btnSend.disabled = true; $('#form-status').textContent = 'Envoi en cours…';
    var payload = {}; f.forEach(function (v, k) { payload[k] = String(v); });
    fetch(CONTACT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json().catch(function () { return {}; }); })
      .then(function () { btnSend.disabled = false; $('#form-status').textContent = ''; showDone(f, false, message); })
      .catch(function () { btnSend.disabled = false; $('#form-status').textContent = ''; mailto(); }); // service indisponible : on retombe sur l'e-mail
  });

  /* ---------- Estimation de prix ---------- */
  var estimate = $('#estimate');
  function money(n) { return n.toLocaleString('fr-FR') + ' €'; }
  function updateEstimate() {
    var site = estimate.querySelector('input[name="est-site"]:checked').value;
    var host = estimate.querySelector('input[name="est-host"]:checked').value;
    var lines = [], total = 0, quote = site === 'multi';
    if (quote) lines.push(['Refonte ou site multi-pages', 'Sur devis']); else { lines.push(['One-Page Express', money(400)]); total += 400; }
    if (host === 'month') { lines.push(['Sérénité & Hébergement (12 × 30 €)', money(360)]); total += 360; }
    if (host === 'year') { lines.push(['Sérénité & Hébergement (2 mois offerts)', money(300)]); total += 300; }
    $('#est-total').textContent = quote ? (host === 'none' ? 'Sur devis' : money(total) + ' + devis') : money(total);
    var ul = $('#est-lines'); ul.textContent = '';
    lines.forEach(function (l) { var li = document.createElement('li'); var a = document.createElement('span'); a.textContent = l[0]; var b = document.createElement('span'); b.textContent = l[1]; li.append(a, b); ul.append(li); });
  }
  estimate.addEventListener('change', updateEstimate);
  updateEstimate();
  $('#est-cta').addEventListener('click', function () {
    var site = estimate.querySelector('input[name="est-site"]:checked').value;
    var host = estimate.querySelector('input[name="est-host"]:checked').value;
    var wanted = host !== 'none' && site === 'express' ? null : (site === 'multi' ? 'Refonte ou site multi-pages' : 'One-Page Express');
    if (wanted) { var r = form.querySelector('input[name="service"][value="' + wanted + '"]'); if (r) r.checked = true; }
    if (resetNeeded()) resetForm();
    $('#contact').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    goStep(wanted ? 2 : 1, false);
    if (!form.querySelector('input[name="activity"]:checked')) goStep(0, false);
  });
  function resetNeeded() { return form.hidden; }

  /* ---------- Démos en direct : liste de cartes + appareil au choix ---------- */
  var show = $('#showcase');
  if (show) {
    var tabs = $$('.sc-tab', show), screen = $('#demo-screen'), openLink = $('#demo-open'), feats = $('#sc-feats'), urlBar = $('#sc-url');
    var devBtns = $$('.sc-switch button', show), cur = 0, device = 'phone', started = false;
    var SIZE = { phone: [390, 800], desktop: [1280, 800] };
    function fit() {
      var wrap = $('.sc-device', show), avail = Math.max(240, wrap.clientWidth - 24), d = SIZE[device];
      var w = device === 'phone' ? Math.min(300, avail - 20) : avail - 22;
      screen.style.setProperty('--iw', d[0]); screen.style.setProperty('--ih', d[1]); screen.style.setProperty('--s', (w / d[0]).toFixed(4));
    }
    function load(i, instant) {
      cur = i; var t = tabs[i], url = t.dataset.demo;
      tabs.forEach(function (x, k) { x.setAttribute('aria-selected', String(k === i)); x.tabIndex = k === i ? 0 : -1; });
      $('#sc-panel').setAttribute('aria-labelledby', t.id); openLink.href = url; urlBar.textContent = 'studio.glsc.fr' + url;
      feats.textContent = ''; t.dataset.features.split('|').forEach(function (f) { var li = document.createElement('li'); li.textContent = f; feats.append(li); });
      var old = $('iframe', screen), frame = document.createElement('iframe');
      frame.src = url; frame.title = 'Démo : ' + t.dataset.title + ', ' + t.dataset.name; frame.loading = 'eager';
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
      frame.addEventListener('load', function () { requestAnimationFrame(function () { frame.classList.add('ready'); var ph = $('.demo-placeholder', screen); if (ph) ph.remove(); if (old) setTimeout(function () { old.remove(); }, 450); }); });
      screen.append(frame);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { if (i !== cur || !started) { started = true; load(i); } });
      t.addEventListener('keydown', function (e) {
        var k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (!k) return;
        e.preventDefault(); var n = (i + k + tabs.length) % tabs.length; tabs[n].focus(); tabs[n].click();
      });
    });
    devBtns.forEach(function (b) { b.addEventListener('click', function () { device = b.dataset.device; show.dataset.device = device; devBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); fit(); }); });
    fit(); addEventListener('resize', fit);
    /* La première démo ne se charge que lorsque la zone devient visible. */
    var launch = function () { if (started) return; started = true; load(0); };
    if ('IntersectionObserver' in window) { var vio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { vio.disconnect(); launch(); } }, { rootMargin: '200px' }); vio.observe(show); } else launch();
  }

})();
