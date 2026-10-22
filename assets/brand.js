/* StudioGLSC — centre de marque : couleurs, aperçu des logos sur fond, essai typographique, sommaire actif. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Couleurs des pastilles et rayons : appliquées via le CSSOM (la CSP interdit les styles en ligne) */
  $$('.bk-sw-fill').forEach(function (e) { e.style.backgroundColor = e.dataset.bg; e.style.color = e.dataset.fg; });
  $$('.bk-radii span').forEach(function (e) { e.style.borderRadius = e.dataset.r + 'px'; });

  /* Aperçu des logos sur fond clair / sombre / bleu / transparent */
  var stages = $$('.bk-stage'), btns = $$('[data-bgset]');
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      stages.forEach(function (s) { s.className = 'bk-stage ' + (b.dataset.bgset === 'auto' ? s.dataset.bg : b.dataset.bgset); });
    });
  });

  /* Essai typographique : le texte d'origine revient si le champ est vidé */
  var demo = $('#type-demo');
  if (demo) { var base = demo.textContent; demo.addEventListener('blur', function () { if (!demo.textContent.trim()) demo.textContent = base; }); demo.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); demo.blur(); } }); }

  /* Inclinaison du monogramme du héros */
  var art = $('.bk-hero-art'), mark = $('.bk-hero-mark');
  if (art && mark && matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    art.addEventListener('pointermove', function (e) { var r = art.getBoundingClientRect(); mark.style.setProperty('--bkr', (((e.clientX - r.left) / r.width - .5) * 22).toFixed(1) + 'deg'); });
    art.addEventListener('pointerleave', function () { mark.style.setProperty('--bkr', '0deg'); });
  }

  /* Sommaire : la section visible est mise en avant */
  var links = $$('.bk-nav a'), map = {};
  links.forEach(function (a) { map[a.hash.slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (a) { a.removeAttribute('aria-current'); }); var a = map[e.target.id]; if (a) { a.setAttribute('aria-current', 'true'); a.scrollIntoView({ inline: 'center', block: 'nearest' }); } } });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }
})();
