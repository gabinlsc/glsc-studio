/* Film promotionnel StudioGLSC — moteur d'animation déterministe : render(t) positionne tout à l'instant t (en secondes).
   Aucune animation CSS : le rendu image par image (render.mjs) donne exactement la même chose à chaque passage. */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eo3 = (x) => 1 - Math.pow(1 - x, 3), eo4 = (x) => 1 - Math.pow(1 - x, 4);
  const expo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const eio = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const eio5 = (x) => (x < .5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2);
  const back = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const spring = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-7 * x) * Math.cos(11 * x));
  window.FPS = 30; window.TOTAL = 47;
  const T = { A: 0, B: 4.2, C: 10.4, D: 18.6, E: 23.6, F: 30.4, G: 36.6, H: 40.3 };
  window.CUTS = Object.values(T).slice(1);

  const META = {};
  const SHOTS = ['home', 'restaurant', 'coiffeur', 'photographe', 'gite', 'club', 'btp'];
  const tf = (el, o) => {
    el.style.transform = `translate3d(${o.x || 0}px,${o.y || 0}px,${o.z || 0}px) rotateX(${o.rx || 0}deg) rotateY(${o.ry || 0}deg) rotateZ(${o.r || 0}deg) scale(${o.s == null ? 1 : o.s})`;
    el.style.opacity = o.o == null ? 1 : o.o; el.style.filter = o.b ? `blur(${o.b}px)` : 'none';
  };
  const lum = (css) => { const m = css.match(/\d+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };

  /* ---------- téléphone ---------- */
  function makePhone(name) {
    const el = document.createElement('div'); el.className = 'phone';
    const bg = (META[name] && META[name].bg) || 'rgb(246,247,249)', dark = lum(bg) < .45;
    el.innerHTML = `<div class="frame"></div><div class="screen" style="background:${bg}"><img class="shot" src="img/${name}.jpg" alt=""><div class="sb" style="background:${bg};color:${dark ? '#fff' : '#0b1220'}"><span>9:41</span><i></i></div></div><div class="island"></div><div class="glare"></div><div class="shadow"></div>`;
    el.shot = $('.shot', el); el.shot.style.top = '44px'; el.screen = $('.screen', el);
    el.scroll = (y) => { el.shot.style.transform = `translateY(${-y}px)`; };
    return el;
  }

  /* ---------- mots ---------- */
  function split(el) {
    $('.ln', el) && [...el.querySelectorAll('.ln')].forEach((ln) => {
      const txt = ln.textContent.trim().split(/\s+/); ln.textContent = '';
      txt.forEach((w, i) => { const s = document.createElement('span'); s.className = 'wd'; s.textContent = w + (i < txt.length - 1 ? ' ' : ''); ln.append(s); });
    });
    return [...el.querySelectorAll('.wd')];
  }
  function words(list, t, t0, o = {}) {
    const st = o.stagger == null ? .1 : o.stagger, dur = o.dur || .9, y = o.y == null ? 70 : o.y, bl = o.blur == null ? 16 : o.blur;
    list.forEach((w, i) => { const p = eo4(P(t, t0 + i * st, t0 + i * st + dur)); tf(w, { y: (1 - p) * y, o: p, b: (1 - p) * bl, s: lerp(.97, 1, p) }); });
  }
  function out(el, t, a, b, dy = -50) { const p = eio(P(t, a, b)); if (p > 0) { el.style.opacity = 1 - p; el.style.transform = `translateY(${dy * p}px)`; el.style.filter = `blur(${p * 14}px)`; } }

  const sc = {}; ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((k) => (sc[k] = $('#s' + k)));
  const wA = split($('#aTitle')), wB = split($('#bTitle')), wD = split($('#dCopy .big')), wE = split($('#eTitle')), wF = split($('#fTitle')), wG = split($('#gTitle'));

  /* scène C : anneau de six téléphones */
  const RING = ['restaurant', 'coiffeur', 'photographe', 'gite', 'club', 'btp'], WORDS = ['Restaurants', 'Coiffeurs', 'Photographes', 'Gîtes', 'Clubs', 'Artisans'];
  const ring = $('#ring'), hero = $('#hero'); let heroPhone, ringPhones = [], cards = [];
  const cardDefs = [['gite', '#sejour', 'Réservation', 'Calendrier, créneaux et tarifs en direct.', 130], ['club', '#agenda', 'Billetterie', 'Places, jauges et paiement en ligne.', 0], ['btp', '#estimer', 'Estimation', 'Un budget chiffré en quelques clics.', 130]];

  /* ---------- transitions ---------- */
  const reveal = (el, t, a, b, kind, cx = 960, cy = 540, ease = eio) => {
    const p = ease(P(t, a, b));
    if (t < a) { el.style.visibility = 'hidden'; return; }
    el.style.visibility = 'visible';
    if (p >= 1) el.style.clipPath = 'none';
    else if (kind === 'circle') el.style.clipPath = `circle(${p * 2600}px at ${cx}px ${cy}px)`;
    else if (kind === 'up') el.style.clipPath = `inset(${(1 - p) * 100}% 0 0 0)`;
    else if (kind === 'left') el.style.clipPath = `inset(0 0 0 ${(1 - p) * 100}%)`;
  };

  function render(t) {
    // --- visibilité / révélations
    sc.A.style.visibility = 'visible';
    reveal(sc.B, t, T.B, T.B + 1.2, 'circle', 1180, 540, eio5);
    reveal(sc.C, t, T.C, T.C + .95, 'up', 0, 0, eio5);
    reveal(sc.D, t, T.D, T.D + 1.1, 'circle', 520, 540, eio5);
    reveal(sc.E, t, T.E, T.E + 1.1, 'circle', 960, 1080, eio5);
    reveal(sc.F, t, T.F, T.F + .95, 'left', 0, 0, eio5);
    reveal(sc.G, t, T.G, T.G + 1.0, 'circle', 960, 540, eio5);
    reveal(sc.H, t, T.H, T.H + 1.1, 'circle', 960, 700, eio5);
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((k, i) => { const nx = ['B', 'C', 'D', 'E', 'F', 'G', 'H'][i]; if (t > T[nx] + 1.25) sc[k].style.visibility = 'hidden'; });
    // fonds : léger défilement du quadrillage
    document.querySelectorAll('.grid').forEach((g) => { g.style.transform = `translate(${-t * 14 % 72}px, ${-t * 9 % 72}px)`; });

    /* ===== A : accroche ===== */
    words(wA, t, .35, { stagger: .13, dur: 1.0 });
    out($('#aTitle'), t, 3.0, 3.9, -80);
    tf($('.g1', sc.A), { s: 1 + t * .02, o: .8 + .2 * Math.sin(t) });

    /* ===== téléphone héros (A → B → C) ===== */
    if (!heroPhone) return;
    const rise = expo(P(t, 3.0, 4.5)), toRight = eio5(P(t, 4.6, 6.2)), exit = eio5(P(t, 10.4, 11.3));
    const bob = Math.sin(t * 1.6) * 10;
    let x = lerp(0, 480, toRight), y = lerp(1000, 0, rise) + bob * rise, ry = lerp(-38, 0, rise) + lerp(0, -14, toRight) + Math.sin(t * .9) * 4 * toRight;
    let rx = lerp(8, 0, rise) + 4 * toRight, rz = lerp(6, 0, rise) + lerp(0, 3, toRight);
    let s = lerp(.92, 1, rise) * lerp(1, .98, toRight);
    // sortie : le téléphone pivote et disparaît pendant que l'anneau arrive
    ry += exit * 80; s *= 1 - exit * .35; x = lerp(x, 0, exit);
    tf(hero, { x, y, ry, rx, r: rz, s, o: t < 3.0 ? 0 : 1 - eo3(P(t, 10.55, 11.2)) });
    hero.style.visibility = t < 3.0 || t > 11.3 ? 'hidden' : 'visible';
    heroPhone.scroll(lerp(0, 1900, eio(P(t, 6.4, 10.2))));

    /* ===== B : promesse ===== */
    words(wB, t, T.B + .75, { stagger: .14 });
    tf($('#bKick'), { y: (1 - eo4(P(t, T.B + .6, T.B + 1.3))) * 30, o: eo3(P(t, T.B + .6, T.B + 1.3)) });
    tf($('#bLede'), { y: (1 - eo4(P(t, T.B + 2.2, T.B + 3))) * 40, o: eo3(P(t, T.B + 2.2, T.B + 3)), b: (1 - eo3(P(t, T.B + 2.2, T.B + 3))) * 10 });
    out($('#bCopy'), t, 9.6, 10.4, -60);

    /* ===== C : anneau ===== */
    const cl = t - T.C, ringIn = eo4(P(t, 10.8, 12.0)), idx = Math.max(0, (t - 11.7) / 1.12), flo = Math.min(Math.floor(idx), 5), frac = idx - Math.floor(idx);
    const stepAng = idx >= 6 ? 6 : flo + eio5(clamp(frac * 1.35 > 1 ? 1 : frac * 1.35)), th = -60 * Math.min(stepAng, 5.0 + eio5(clamp((idx - 5) * 1.35)));
    const R = 900, cy = Math.sin(t * 1.3) * 8;
    tf(ring, { z: -R * ringIn * 0 + 0, o: 1 });
    ring.style.transform = `translate3d(0, ${cy - 78}px, ${-R + (1 - ringIn) * -900}px) rotateX(-6deg) rotateY(${th - (1 - ringIn) * 120}deg) scale(${lerp(.55, 1, ringIn)})`;
    ring.style.opacity = ringIn;
    ringPhones.forEach((p, i) => {
      p.style.transform = `rotateY(${i * 60}deg) translateZ(${R}px) scale(.76)`;
      const front = Math.abs((((i * 60 + th) % 360) + 540) % 360 - 180); // 0 = face caméra
      p.scroll(lerp(0, 520, eio(P(t, 11.7 + i * 1.1, 12.9 + i * 1.1))) + Math.sin(t * 1.1 + i) * 8);
    });
    const wi = Math.min(5, Math.round(Math.min(idx, 5.49))), w0 = 11.7 + wi * 1.12 - .25;
    const cap = $('#cWord'); if (cap.dataset.i !== String(wi)) { cap.dataset.i = wi; cap.innerHTML = `<span class="wd">${WORDS[wi]}</span>`; }
    const wp = eo4(P(t, w0, w0 + .55)); tf($('.wd', cap), { y: (1 - wp) * 60, o: wp * (1 - eio(P(t, 18.1, 18.7))), b: (1 - wp) * 12 });
    tf($('#cKick'), { o: eo3(P(t, 11.2, 12)) * (1 - eio(P(t, 18.0, 18.6))), y: (1 - eo3(P(t, 11.2, 12))) * -20 });
    tf($('.g1', sc.C), { s: 1 + cl * .01 });

    /* ===== D : 48 heures ===== */
    const dl = t - T.D, dp = eio(P(t, T.D + .5, T.D + 3.4));
    $('#dVal').textContent = Math.round(48 * dp);
    const C = 2 * Math.PI * 268; const pr = $('#dRing .pr'); pr.style.strokeDasharray = C; pr.style.strokeDashoffset = C * (1 - dp);
    tf($('#dNum'), { s: lerp(.8, 1, spring(P(t, T.D + .2, T.D + 1.3))), o: eo3(P(t, T.D + .2, T.D + .8)) });
    words(wD, t, T.D + .9, { stagger: .12, dur: .9 }); tf($('#dCopy .kick'), { o: eo3(P(t, T.D + .7, T.D + 1.3)), y: (1 - eo3(P(t, T.D + .7, T.D + 1.3))) * 24 });
    [...$('#dSteps').children].forEach((li, i) => {
      const a = T.D + 1.9 + i * .8, p = eo4(P(t, a, a + .6)), on = dp > (i + .15) / 3;
      tf(li, { y: (1 - p) * 40, o: p }); li.style.color = on ? '#fff' : '#566074'; li.style.background = on ? '#2447d6' : '#fff'; li.style.borderColor = on ? '#2447d6' : '#d9deea';
    });
    out($('#dNum'), t, 23.0, 23.7, -30); out($('#dCopy'), t, 23.0, 23.7, -30);

    /* ===== E : fonctionnalités ===== */
    words(wE, t, T.E + .7, { stagger: .11 });
    cards.forEach((c, i) => {
      const a = T.E + 1.5 + i * .45, p = expo(P(t, a, a + 1.1)), x = 110 + i * 590;
      const sway = Math.sin(t * 1.2 + i) * 6;
      tf(c.el, { x, y: (1 - p) * 700 + sway * p, ry: (i - 1) * -10 * (1 - p * .7), rx: (1 - p) * 14, s: lerp(.86, 1, p), o: eo3(P(t, a, a + .5)) });
      const win = c.win; const sp = eio(P(t, a + .6, a + 4.8)); c.img.style.transform = `translateY(${-(c.y0 + sp * c.dy)}px)`;
    });
    out($('#eTitle'), t, 29.6, 30.4, -40); cards.forEach((c) => { const o = eio(P(t, 29.8, 30.5)); if (o > 0) { c.el.style.opacity = 1 - o; } });

    /* ===== F : prix ===== */
    words(wF, t, T.F + .6, { stagger: .12 });
    [...$('#fPrices').children].forEach((pc, i) => {
      const a = T.F + 1.1 + i * .38, p = expo(P(t, a, a + 1.0)); tf(pc, { y: (1 - p) * 120, o: eo3(P(t, a, a + .5)), s: lerp(.94, 1, p), b: (1 - p) * 8 });
      const b = $('b', pc), v = +b.dataset.v; b.textContent = Math.round(v * eo4(P(t, a + .25, a + 1.6)));
    });
    tf($('#fFoot'), { o: eo3(P(t, T.F + 3.2, T.F + 4)), y: (1 - eo3(P(t, T.F + 3.2, T.F + 4))) * 30 });
    out($('#fPrices'), t, 35.9, 36.6, -50); out($('#fTitle'), t, 35.9, 36.6, -40); out($('#fFoot'), t, 35.9, 36.6, 20);

    /* ===== G : appel à l'action ===== */
    words(wG, t, T.G + .55, { stagger: .12 });
    const btn = $('#gBtn'), bp = expo(P(t, T.G + 1.5, T.G + 2.4)), press = P(t, 39.55, 39.75) * (1 - P(t, 39.75, 40.05));
    btn.style.transform = `translateX(-50%) translateY(${(1 - bp) * 90}px) scale(${lerp(.9, 1, bp) - press * .05})`; btn.style.opacity = eo3(P(t, T.G + 1.5, T.G + 2)); btn.style.filter = `blur(${(1 - bp) * 10}px)`;
    const cp = eio(P(t, 38.3, 39.5)), cx = lerp(1560, 1010, cp), cyy = lerp(930, 690, cp) - Math.sin(cp * Math.PI) * 60;
    tf($('#gCursor'), { x: cx, y: cyy, s: 1 - press * .12, o: eo3(P(t, 38.2, 38.6)) * (1 - eo3(P(t, 40.1, 40.5))) });
    const rp = eo3(P(t, 39.6, 40.3)); tf($('#gRip'), { x: 1010, y: 700, s: rp * 3.2, o: (1 - rp) * (rp > 0 ? 1 : 0) });
    out($('#gTitle'), t, 40.0, 40.6, -40);

    /* ===== H : logo ===== */
    const mp = spring(P(t, T.H + .6, T.H + 1.8)), gdraw = eio(P(t, T.H + 1.0, T.H + 2.4)), gfill = eo3(P(t, T.H + 2.1, T.H + 2.7));
    const mark = $('#lMark'), g = $('#lG'); mark.style.transform = `scale(${lerp(.2, 1, mp)}) rotate(${lerp(-24, 0, mp)}deg)`; mark.style.opacity = eo3(P(t, T.H + .5, T.H + 1));
    g.style.strokeDashoffset = 1 - gdraw; g.style.fill = `rgba(255,255,255,${gfill})`; g.style.strokeWidth = (1 - gfill) * .5;
    const lw = eio5(P(t, T.H + 2.2, T.H + 3.5)), wd = $('#lWord'), logo = $('#logo');
    wd.style.maxWidth = (window.WORD_W * lw) + 'px'; logo.style.gap = (42 * lw) + 'px'; wd.style.opacity = lw > 0 ? 1 : 0;
    [...wd.children].forEach((sp, i) => { sp.style.transform = `translateX(${-(1 - lw) * 120}px)`; });
    const tg = eo4(P(t, T.H + 3.4, T.H + 4.2)), ur = eo4(P(t, T.H + 3.9, T.H + 4.7));
    tf($('#lTag'), { y: (1 - tg) * 36, o: tg, b: (1 - tg) * 10 }); tf($('#url'.replace('#url', '#lUrl')), { y: (1 - ur) * 36, o: ur, b: (1 - ur) * 10 });
    tf($('.g3', sc.H), { s: lerp(.8, 1.05, P(t, T.H, 47)), o: eo3(P(t, T.H + .3, T.H + 2)) });
    $('#fade').style.opacity = Math.max(1 - eo3(P(t, 0, .5)), eo3(P(t, 46.2, 47)));
  }
  window.render = render;

  /* ---------- initialisation ---------- */
  (async function init() {
    await document.fonts.ready;
    Object.assign(META, await (await fetch('img/meta.json')).json());
    const fav = await (await fetch('../assets/favicon.svg')).text(); $('#lG').setAttribute('d', fav.split('<path d="')[1].split('"')[0]);
    // taille du logotype (pour l'animation de largeur)
    const wd = $('#lWord'); wd.style.maxWidth = 'none'; window.WORD_W = wd.scrollWidth + 24; wd.style.maxWidth = '0px';
    heroPhone = makePhone('home'); hero.append(heroPhone);
    RING.forEach((n) => { const p = makePhone(n); ring.append(p); ringPhones.push(p); });
    cardDefs.forEach(([name, sel, h, d, dy], i) => {
      const meta = META[name], k = 472 / 390, el = document.createElement('div'); el.className = 'card';
      el.innerHTML = `<div class="win"><img src="img/${name}.jpg" alt=""></div><h3>${h}</h3><p>${d}</p>`; $('#eCards').append(el);
      cards.push({ el, img: $('img', el), win: $('.win', el), y0: (meta.top[sel] - 40) * k, dy: dy * k });
    });
    window.READY = true; render(0);
  })();
})();
