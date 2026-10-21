/* StudioGLSC — comportement de la page d'accueil (aucune dépendance). */
(function () {
  'use strict';
  // Renseigner le numéro public au format international, par exemple +33612345678.
  var CONTACT_PHONE = '+33767204424';
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
  var links = $$('#desktop-nav a.nav-link');
  if ('IntersectionObserver' in window && links.length) {
    var byId = {};
    links.forEach(function (l) { byId[l.hash.slice(1)] = l; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.removeAttribute('aria-current'); });
        if (byId[en.target.id]) byId[en.target.id].setAttribute('aria-current', 'location');
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

  /* ---------- Formulaire : prépare un e-mail (rien n'est enregistré) ---------- */
  var form = $('#contact-form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var f = new FormData(form);
    var name = String(f.get('name')).trim();
    var email = String(f.get('email')).trim();
    var service = String(f.get('service'));
    var message = String(f.get('message')).trim();
    var subject = 'Demande de contact StudioGLSC — ' + service;
    var body = 'Bonjour Gabin,\n\n' + message + '\n\nNom : ' + name + '\nE-mail : ' + email + '\nBesoin : ' + service;
    $('#form-status').textContent = 'Votre application de messagerie va s’ouvrir avec le message préparé. Envoyez-le pour finaliser votre demande.';
    window.location.href = 'mailto:pro@glsc.fr?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });

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
