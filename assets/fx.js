/* StudioGLSC — couche d'animations. Sans dépendance, sans style en ligne (tout passe par le CSSOM).
   Respecte prefers-reduced-motion (tout est alors affiché tel quel) et n'active les effets au pointeur que sur appareil à souris. */
(function () {
  'use strict';
  var root = document.documentElement;
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add(calm ? 'fx-calm' : 'fx-on');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var raf = function (fn) { var t = false; return function () { var a = arguments; if (t) return; t = true; requestAnimationFrame(function () { t = false; fn.apply(null, a); }); }; };

  function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }
  ready(function () {
    /* ---------- Titres découpés en mots ---------- */
    function split(el) {
      if (el.classList.contains('fx-split')) return;
      var label = el.textContent.replace(/\s+/g, ' ').trim(), n = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (c) {
          if (c.nodeType === 3) {
            var parts = c.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
            parts.forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.append(document.createTextNode(' ')); return; }
              var m = document.createElement('span'); m.className = 'fxw'; m.setAttribute('aria-hidden', 'true');
              var i = document.createElement('span'); i.textContent = p; i.style.setProperty('--i', n++); m.append(i); frag.append(m);
            });
            node.replaceChild(frag, c);
          } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
        });
      })(el);
      el.setAttribute('aria-label', label); el.classList.add('fx-split');
    }
    var heads = $$('.hero h1, .section-head h2, .page-hero h1, .brand-hero h1, [data-fx-split]');
    heads.forEach(split);
    var show = function (el) { el.classList.add('fx-in'); };
    if (calm || !('IntersectionObserver' in window)) heads.forEach(show);
    else {
      var hio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); hio.unobserve(e.target); } }); }, { threshold: .35, rootMargin: '0px 0px -8% 0px' });
      heads.forEach(function (h) { if (h.closest('.hero')) requestAnimationFrame(function () { requestAnimationFrame(function () { show(h); }); }); else hio.observe(h); });
    }

    /* ---------- Fond du héros ---------- */
    var hero = $('.hero');
    if (hero && !calm) {
      var au = document.createElement('div'); au.className = 'fx-aurora'; au.setAttribute('aria-hidden', 'true'); au.innerHTML = '<i></i><i></i><i></i>'; hero.prepend(au);
    }
    $$('.mock-h, .mock-p, .mock-pill, .mock-btn, .mock-actions > *').forEach(function (e, i) { e.style.setProperty('--b', i % 9); });
    $$('.mock-card').forEach(function (e, i) { e.style.setProperty('--b', i); });

    /* ---------- Pointeur : grille éclairée + inclinaison de la maquette ---------- */
    if (hero && fine && !calm) {
      var mock = $('.mock', hero), chips = $$('.mock-chip', hero);
      var move = raf(function (e) {
        var r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        hero.style.setProperty('--mx', x + 'px'); hero.style.setProperty('--my', y + 'px');
        if (!mock) return;
        var m = mock.getBoundingClientRect(), dx = (e.clientX - (m.left + m.width / 2)) / innerWidth, dy = (e.clientY - (m.top + m.height / 2)) / innerHeight;
        mock.style.setProperty('--ry', (dx * 14).toFixed(2) + 'deg'); mock.style.setProperty('--rx', (-dy * 12).toFixed(2) + 'deg');
        mock.style.setProperty('--px', (dx * -26).toFixed(1) + 'px'); mock.style.setProperty('--py', (dy * -20).toFixed(1) + 'px');
        chips.forEach(function (c, i) { c.style.setProperty('--cx', (dx * (i ? 34 : -28)).toFixed(1) + 'px'); c.style.setProperty('--cy', (dy * 22).toFixed(1) + 'px'); });
      });
      hero.addEventListener('pointermove', move);
      hero.addEventListener('pointerleave', function () { ['--rx', '--ry', '--px', '--py'].forEach(function (v) { mock && mock.style.setProperty(v, '0px'); }); if (mock) { mock.style.setProperty('--rx', '0deg'); mock.style.setProperty('--ry', '0deg'); } });
    }

    /* ---------- Compteurs des chiffres clés ---------- */
    $$('.metric strong').forEach(function (el) {
      var m = /^(\d+)(.*)$/.exec(el.textContent.trim()); if (!m || calm) return;
      var end = parseInt(m[1].replace(/\s/g, ''), 10), tail = m[2], full = el.textContent;
      if (!end) return;
      el.setAttribute('aria-label', full.trim());
      var run = function () { var t0 = performance.now(), D = 1300; (function f(t) { var p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(end * e).toLocaleString('fr-FR') + tail; if (p < 1) requestAnimationFrame(f); else el.textContent = full; })(t0); };
      if ('IntersectionObserver' in window) { var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); run(); } }, { threshold: .6 }); o.observe(el); }
    });

    /* ---------- Cartes : halo qui suit la souris ---------- */
    if (fine && !calm) {
      var cards = $$('.service, .price-card, .pledge, .metric, .project, .link-card, .step, .timeline-step');
      cards.forEach(function (c) { c.classList.add('fx-glow'); var g = document.createElement('span'); g.className = 'fx-gl'; g.setAttribute('aria-hidden', 'true'); c.prepend(g); });
      document.addEventListener('pointermove', raf(function (e) {
        var c = e.target.closest && e.target.closest('.fx-glow'); if (!c) return;
        var r = c.getBoundingClientRect(); c.style.setProperty('--gx', (e.clientX - r.left) + 'px'); c.style.setProperty('--gy', (e.clientY - r.top) + 'px');
      }), { passive: true });
    }

    /* ---------- Boutons : ondulation au clic (aucun effet de suivi du curseur) ---------- */
    if (!calm) $$('.btn').forEach(function (b) {
      b.addEventListener('pointerdown', function (e) {
        var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, d = document.createElement('span'); d.className = 'fx-ripple'; d.setAttribute('aria-hidden', 'true');
        d.style.width = d.style.height = s + 'px'; d.style.left = (e.clientX - r.left - s / 2) + 'px'; d.style.top = (e.clientY - r.top - s / 2) + 'px'; b.append(d); setTimeout(function () { d.remove(); }, 700);
      });
    });

    /* ---------- Bandeau : la vitesse et le sens suivent le défilement ---------- */
    var tk = $('.fx-ticker-track');
    if (tk && !calm && tk.animate) {
      tk.innerHTML += tk.innerHTML; // boucle sans couture : deux copies, on décale de moitié
      var anim = tk.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 38000, iterations: Infinity }), last = scrollY, vel = 0, dir = 1;
      var step = function () {
        var dy = scrollY - last; last = scrollY; vel += (Math.min(Math.abs(dy), 90) - vel) * .12; if (dy) dir = dy > 0 ? 1 : -1;
        anim.playbackRate = dir * (1 + vel * .55); tk.style.transform = ''; tk.parentElement.style.setProperty('--sk', (dir * Math.min(vel, 40) * -.18).toFixed(2) + 'deg');
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      var vis = new IntersectionObserver(function (es) { es[0].isIntersecting ? anim.play() : anim.pause(); }); vis.observe(tk.parentElement);
    }

    /* ---------- Pied de page : grand logotype lettre par lettre ---------- */
    var mega = $('.fx-mega');
    if (mega) {
      var txt = mega.getAttribute('data-text') || 'StudioGLSC'; mega.textContent = '';
      txt.split('').forEach(function (ch, i) { var s = document.createElement('span'); s.textContent = ch; s.style.setProperty('--i', i); if (i === 0) s.className = 'g'; mega.append(s); });
      if (calm || !('IntersectionObserver' in window)) mega.classList.add('fx-in'); else { var mo = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { mega.classList.add('fx-in'); mo.disconnect(); } }, { threshold: .3 }); mo.observe(mega); }
    }

    /* ---------- Copier en un clic ---------- */
    var toast;
    function say(msg) {
      if (!toast) { toast = document.createElement('div'); toast.className = 'fx-toast'; toast.setAttribute('role', 'status'); document.body.append(toast); }
      toast.textContent = msg; toast.classList.remove('show'); void toast.offsetWidth; toast.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(function () { toast.classList.remove('show'); }, 2200);
    }
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-copy'), done = function () { say((b.getAttribute('data-copied') || 'Copié') + ' : ' + v); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function () { say('Sélectionnez et copiez : ' + v); }); else say('Sélectionnez et copiez : ' + v);
      });
    });
    window.StudioFx = { say: say };

    /* ---------- Bascule de thème en onde circulaire (View Transitions) ---------- */
    var tbtn = $('#theme-toggle'), reentry = false;
    if (tbtn && !calm && document.startViewTransition) {
      tbtn.addEventListener('click', function (e) {
        if (reentry) return; e.stopImmediatePropagation(); e.preventDefault();
        var r = tbtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        root.classList.add('fx-theme-vt');
        var vt = document.startViewTransition(function () { reentry = true; tbtn.click(); reentry = false; });
        vt.ready.then(function () { root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }); }).catch(function () {});
        vt.finished.finally(function () { root.classList.remove('fx-theme-vt'); });
      }, true);
    }

    /* ---------- Retour en haut + barre d'appel mobile + ombre de l'en-tête ---------- */
    var header = $('#header'), top = $('.fx-top'), mcta = $('.m-cta'), ring = top && $('.pr', top), C = 2 * Math.PI * 22;
    if (ring) { ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C; }
    var contact = $('#contact'), heroEl = $('.hero');
    var lastY = 0, run = 0, small = matchMedia('(max-width: 720px)');
    var onScroll = raf(function () {
      var y = scrollY, h = document.documentElement.scrollHeight - innerHeight, p = h > 0 ? y / h : 0;
      if (header) {
        header.classList.toggle('fx-stuck', y > 8);
        var open = document.getElementById('menu-toggle') && document.getElementById('menu-toggle').getAttribute('aria-expanded') === 'true';
        /* L'en-tête se range après un vrai geste vers le bas (48 px cumulés) et revient après un geste vers le haut (24 px) :
           pas de va-et-vient avec les micro-mouvements de l'élan tactile ou de la barre d'adresse mobile. */
        var dy = y - lastY; if (dy * run < 0) run = 0; run += dy;
        if (!small.matches || open || y < 360 || header.contains(document.activeElement)) header.classList.remove('fx-hide');
        else if (run > 48) header.classList.add('fx-hide');
        else if (run < -24) header.classList.remove('fx-hide');
      }
      lastY = y;
      if (top) { top.classList.toggle('show', y > 700); ring.style.strokeDashoffset = C * (1 - p); }
      if (mcta) {
        var past = heroEl ? y > heroEl.offsetHeight * .8 : y > 500, inContact = false;
        if (contact) { var r = contact.getBoundingClientRect(); inContact = r.top < innerHeight * .55 && r.bottom > 0; }
        mcta.classList.toggle('show', past && !inContact);
      }
    });
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (top) top.addEventListener('click', function (e) { e.preventDefault(); scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }); });
  });
})();
