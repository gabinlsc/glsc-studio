/* Socle commun des démos : apparitions au scroll, titres découpés, compteurs, parallaxe, en-tête, ancres.
   Aucune dépendance. Respecte prefers-reduced-motion : sans mouvement, tout est affiché tel quel. */
(function () {
  'use strict';
  var root = document.documentElement;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!calm) root.classList.add('js-motion');
  try { if (window.self !== window.top) root.classList.add('is-embedded'); } catch (e) { root.classList.add('is-embedded'); }
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  window.Demo = { $: $, $$: $$, calm: calm };

  document.addEventListener('DOMContentLoaded', function () {
    /* Titres : chaque ligne est dans un masque, les mots glissent l'un après l'autre */
    $$('[data-split]').forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/); el.textContent = ''; el.setAttribute('aria-label', words.join(' '));
      words.forEach(function (w, i) {
        var mask = document.createElement('span'); mask.className = 'sw'; mask.setAttribute('aria-hidden', 'true');
        var inner = document.createElement('span'); inner.textContent = w; inner.style.setProperty('--i', i); mask.append(inner);
        el.append(mask, document.createTextNode(' '));
      });
    });

    /* Apparitions */
    var targets = $$('.rv, .rv-clip, [data-split]');
    if (calm || !('IntersectionObserver' in window)) targets.forEach(function (t) { t.classList.add('in'); });
    else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { (e.target._rv || e.target).classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
      // Un élément entièrement rogné par clip-path ne « croise » jamais le viewport : on observe alors son parent.
      targets.forEach(function (t) { if (t.dataset.d) t.style.setProperty('--d', t.dataset.d + 'ms'); var o = t.classList.contains('rv-clip') ? t.parentElement : t; o._rv = t; io.observe(o); });
    }

    /* Compteurs */
    $$('[data-count]').forEach(function (el) {
      var end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, suffix = el.dataset.suffix || '';
      var fmt = function (v) { return v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix; };
      el.textContent = fmt(end); if (calm || !('IntersectionObserver' in window)) return;
      var seen = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; seen.disconnect();
        var t0 = performance.now(), dur = 1400;
        (function tick(t) { var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(end * e); if (p < 1) requestAnimationFrame(tick); })(t0);
      }, { threshold: 0.6 }); seen.observe(el);
    });

    /* Parallaxe douce (une seule boucle rAF, uniquement quand l'élément est visible) */
    var par = $$('[data-parallax]');
    if (par.length && !calm) {
      var vis = new Set(), ticking = false;
      var vo = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? vis.add(e.target) : vis.delete(e.target); }); update(); }, { rootMargin: '10% 0px' });
      par.forEach(function (p) { vo.observe(p); });
      var update = function () { ticking = false; var vh = innerHeight; vis.forEach(function (el) { var r = el.parentElement.getBoundingClientRect(); var k = (r.top + r.height / 2 - vh / 2) / vh; el.style.setProperty('--py', (k * parseFloat(el.dataset.parallax)).toFixed(1) + 'px'); }); };
      addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    }

    /* En-tête : ombre fine après le haut de page */
    var head = $('.dm-header');
    if (head) { var on = function () { head.classList.toggle('is-stuck', scrollY > 8); }; on(); addEventListener('scroll', on, { passive: true }); }

    /* Ancres : défilement doux, focus déplacé sur la cible */
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1); var t = id && document.getElementById(id); if (!t) return;
        e.preventDefault(); t.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
        if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
        history.replaceState(null, '', '#' + id);
      });
    });
  });
})();
