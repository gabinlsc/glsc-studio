/* StudioGLSC — comportement commun à toutes les pages (aucune dépendance). */
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

  window.StudioCfg = { BOOKING_URL: BOOKING_URL, REPLY_DELAY: REPLY_DELAY, CONTACT_ENDPOINT: CONTACT_ENDPOINT, $: $, $$: $$, reduceMotion: reduceMotion };

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
  matchMedia('(min-width: 1100px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

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
    if (steps) {
      var r = steps.getBoundingClientRect();
      steps.style.setProperty('--steps-progress', String(Math.max(0, Math.min(1, (innerHeight * 0.78 - r.top) / (r.height * 0.8)))));
    }
    ticking = false;
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Prise de rendez-vous ---------- */
  $$('[data-booking-link]').forEach(function (link) {
    if (!BOOKING_URL) return;
    link.href = BOOKING_URL; link.target = '_blank'; link.rel = 'noopener noreferrer';
    var label = $('[data-booking-label]', link); if (label) label.textContent = 'Réserver un échange gratuit';
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

  var yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
