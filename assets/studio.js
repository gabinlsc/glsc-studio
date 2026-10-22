/* StudioGLSC — comportement de la page d'accueil (aucune dépendance). */
(function () {
  'use strict';
  // --- Réglages (à adapter ici, nulle part ailleurs) ---
  // Numéro public au format international, par exemple +33612345678.
  var CONTACT_PHONE = '+33767204424';
  // Lien de prise de rendez-vous (Cal.com, Calendly…). Vide : le bouton propose d'écrire pour convenir d'un créneau.
  var BOOKING_URL = '';
  // Délai de réponse annoncé après l'envoi du formulaire, par exemple 'sous 24 h ouvrées'. Vide : aucune promesse de délai.
  var REPLY_DELAY = '';
  // Adresse du service qui reçoit les demandes (POST JSON). Vide : le formulaire prépare un e-mail dans la messagerie du visiteur.
  var CONTACT_ENDPOINT = '';
  // ------------------------------------------------------
  var PHONE_DIGITS = CONTACT_PHONE.replace(/\D/g, '');
  var WHATSAPP_PHONE = PHONE_DIGITS.indexOf('0') === 0 ? '33' + PHONE_DIGITS.slice(1) : PHONE_DIGITS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Thème ---------- */
  var themeButton = $('#theme-toggle');
  function setTheme(theme, remember) {
    root.dataset.theme = theme;
    if (remember) { try { localStorage.setItem('studioglsc-theme', theme); } catch (e) { /* stockage indisponible */ } }
    $('meta[name="theme-color"]').content = theme === 'dark' ? '#0a0f1c' : '#f6f7f9';
    themeButton.setAttribute('aria-label', theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre');
  }
  setTheme(root.dataset.theme || 'light', false);
  themeButton.addEventListener('click', function () {
    var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!reduceMotion && document.startViewTransition) document.startViewTransition(function () { setTheme(next, true); });
    else {
      root.classList.add('theme-transition');
      setTheme(next, true);
      setTimeout(function () { root.classList.remove('theme-transition'); }, 450);
    }
  });

  /* ---------- Menu mobile ---------- */
  var menuButton = $('#menu-toggle');
  var menu = $('#mobile-menu');
  var menuIcon = $('use', menuButton);
  function setMenu(open, restoreFocus) {
    menu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menuIcon.setAttribute('href', open ? '#i-close' : '#i-menu');
    if (!open && restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', function () { setMenu(menuButton.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true); });
  matchMedia('(min-width: 900px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  /* ---------- Apparition au défilement ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    reveals.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + 'ms'; io.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add('visible'); });

  /* ---------- Défilement : barre de progression, en-tête, étapes ---------- */
  var header = $('#header');
  var progress = $('.scroll-progress');
  var fill = $('span', progress);
  var steps = $('#methode .steps');
  var ticking = false;
  function onScroll() {
    var scrollable = root.scrollHeight - innerHeight;
    var value = scrollable > 0 ? Math.min(100, Math.max(0, scrollY / scrollable * 100)) : 0;
    fill.style.transform = 'scaleX(' + value / 100 + ')';
    progress.setAttribute('aria-valuenow', String(Math.round(value)));
    header.classList.toggle('is-scrolled', scrollY > 8);
    var r = steps.getBoundingClientRect();
    steps.style.setProperty('--steps-progress', String(Math.max(0, Math.min(1, (innerHeight * 0.78 - r.top) / (r.height * 0.8)))));
    ticking = false;
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Lien actif dans la navigation ---------- */
  var links = $$('#desktop-nav a.nav-link').concat($$('#rail a'));
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
  function bookingText() { return BOOKING_URL ? 'Vous préférez en parler de vive voix ? Réservez un échange gratuit.' : ''; }
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

  /* ---------- Démos en direct dans un téléphone ---------- */
  var demoTabs = $$('.seg button'), demoOpen = $('#demo-open'), screen = $('#demo-screen');
  var demoUrl = demoTabs[0].dataset.demo, demoTitle = demoTabs[0].dataset.title;
  function loadDemo() {
    screen.textContent = '';
    var frame = document.createElement('iframe');
    frame.src = demoUrl; frame.title = 'Démo : ' + demoTitle; frame.loading = 'lazy';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
    screen.append(frame);
  }
  demoTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      demoTabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });
      demoUrl = tab.dataset.demo; demoTitle = tab.dataset.title; demoOpen.href = demoUrl;
      if (screen.querySelector('iframe')) loadDemo();
    });
  });
  $('#demo-launch').addEventListener('click', loadDemo);
  function fitDemo() { screen.style.setProperty('--s', String(screen.clientWidth / 390)); }
  fitDemo(); addEventListener('resize', fitDemo);

  /* ---------- Prise de rendez-vous ---------- */
  $$('[data-booking-link]').forEach(function (link) {
    if (!BOOKING_URL) return;
    link.href = BOOKING_URL; link.target = '_blank'; link.rel = 'noopener noreferrer';
    var label = $('[data-booking-label]', link); if (label) label.textContent = 'Réserver un échange gratuit';
  });
  void bookingText;

  /* ---------- Téléphone et WhatsApp ---------- */
  function enable(link) { link.removeAttribute('aria-disabled'); link.removeAttribute('tabindex'); link.removeAttribute('title'); }
  $$('[data-whatsapp-link]').forEach(function (link) {
    if (/^\d{8,15}$/.test(WHATSAPP_PHONE)) {
      link.href = 'https://wa.me/' + WHATSAPP_PHONE + '?text=' + encodeURIComponent('Bonjour Gabin, je vous contacte au sujet de la création de mon site.');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      enable(link);
    }
  });
  $$('[data-phone-link]').forEach(function (link) {
    if (CONTACT_PHONE.trim()) { link.href = 'tel:' + CONTACT_PHONE.replace(/[^\d+]/g, ''); enable(link); }
  });

  $('#year').textContent = new Date().getFullYear();
})();
