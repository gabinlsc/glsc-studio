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

  /* ---------- Estimation de prix (tarifs : window.OFFRES, généré depuis tools/content/offres.mjs) ---------- */
  var estimate = $('#estimate'), O = window.OFFRES;
  function money(n) { return n.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') + ' €'; }
  function checked(name) { return estimate.querySelector('input[name="' + name + '"]:checked').value; }
  var SERVICE_OF = { express: 'Express', pack: 'Pack Lancement', vitrine: 'Vitrine', boutique: 'Boutique en ligne' };
  var summary = '';
  function updateEstimate() {
    var site = checked('est-site'), plan = checked('est-plan'), bill = plan === 'none' ? 'month' : checked('est-bill');
    $$('fieldset[data-for]', estimate).forEach(function (f) { f.hidden = f.dataset.for !== site; });
    $$('fieldset[data-for-plan]', estimate).forEach(function (f) { f.hidden = plan === 'none'; });
    $$('[data-hide-for]', estimate).forEach(function (l) {
      var hide = l.dataset.hideFor.split(' ').indexOf(site) >= 0; l.hidden = hide;
      var i = l.querySelector('input'); if (hide && i.checked) i.checked = false;
    });
    var none = $('.est-none', estimate); if (none) none.hidden = $$('.est-chip:not([hidden])', estimate).length > 0;
    var lines = [], lo = 0, hi = 0, open = false, quote = site === 'vitrine' || site === 'boutique';
    if (site === 'express') { lines.push(['Express', money(O.express)]); lo = hi = O.express; }
    else if (site === 'pack') { lines.push(['Pack Lancement', money(O.pack)]); lo = hi = O.pack; }
    else {
      var t = site === 'vitrine' ? O.vitrine[+checked('est-pages')] : O.boutique[+checked('est-prod')];
      lines.push([(site === 'vitrine' ? 'Vitrine · ' : 'Boutique · ') + t[2], t[1] ? money(t[0]) + ' à ' + money(t[1]) : 'dès ' + money(t[0])]);
      lo = t[0]; hi = t[1]; open = !t[1];
    }
    $$('input[name="est-opt"]:checked', estimate).forEach(function (i) { var o = O.options[i.value]; lines.push([o.name, money(o.price)]); lo += o.price; if (hi != null) hi += o.price; });
    var ref = estimate.querySelector('input[name="est-ref"]').checked;
    if (ref) { lines.push(['Parrainage', '− ' + money(O.filleul)]); lo -= O.filleul; if (hi != null) hi -= O.filleul; }
    var sub = 0;
    if (plan !== 'none') {
      var sp = O.serenite[plan]; sub = bill === 'year' ? sp.year : 12 * sp.month;
      lines.push(['Sérénité ' + sp.name + (bill === 'year' ? ' (2 mois offerts)' : ' (12 × ' + money(sp.month) + ')'), money(sub)]);
    }
    $('#est-label').textContent = quote ? 'Estimation de départ' : 'Votre première année';
    $('#est-total').textContent = !quote ? money(lo + sub) : open ? 'Dès ' + money(lo + sub) : money(lo + sub) + ' – ' + money(hi + sub);
    $('#est-note').textContent = quote
      ? 'Estimation indicative, le prix exact est précisé dans un devis gratuit avant tout démarrage. Prix TTC : TVA non applicable (art. 293 B du CGI).'
      : 'Prix TTC : TVA non applicable (franchise en base, article 293 B du CGI). Estimation indicative, le devis fait foi.';
    var ul = $('#est-lines'); ul.textContent = '';
    lines.forEach(function (l) { var li = document.createElement('li'); var a = document.createElement('span'); a.textContent = l[0]; var b = document.createElement('span'); b.textContent = l[1]; li.append(a, b); ul.append(li); });
    summary = 'Mon estimation : ' + lines.map(function (l) { return l[0] + ' ' + l[1]; }).join(' ; ') + ' → ' + $('#est-total').textContent + '.';
  }
  estimate.addEventListener('change', updateEstimate);
  updateEstimate();
  function chooseService(name, note) {
    var r = form.querySelector('input[name="service"][value="' + name + '"]'); if (r) r.checked = true;
    if (resetNeeded()) resetForm();
    var msg = form.querySelector('[name="message"]'); if (msg && note && !msg.value.trim()) msg.value = note;
    $('#contact').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    goStep(2, false);
    if (!form.querySelector('input[name="activity"]:checked')) goStep(0, false);
  }
  $('#est-cta').addEventListener('click', function () { chooseService(SERVICE_OF[checked('est-site')], summary); });
  // Les cartes Vitrine et Boutique ouvrent l'estimation avec la bonne formule
  $$('[data-pick]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var r = estimate.querySelector('input[name="est-site"][value="' + a.dataset.pick + '"]'); if (r) { r.checked = true; updateEstimate(); }
      e.preventDefault(); estimate.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
  $$('[data-choose]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); chooseService(a.dataset.choose); }); });
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

  /* ---------- Film de présentation : choix de la durée et du format ---------- */
  var film = $('#film-box'), video = $('#film-video');
  if (film && video) {
    var opts = $('.film-opts', film); opts.hidden = false;
    var swap = function () {
      var base = '/assets/video/studioglsc-' + (film.dataset.len === 'short' ? 'court' : 'complet') + '-' + film.dataset.fmt;
      video.pause(); video.poster = base + '.webp'; $('source', video).src = base + '.mp4'; video.load();
    };
    $$('button', opts).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.len ? 'len' : 'fmt'; film.dataset[k] = b.dataset[k];
        $$('button[data-' + k + ']', opts).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); swap();
      });
    });
  }

})();
