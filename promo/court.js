/* Film court StudioGLSC (≈ 17 s) : montage propre, quatre scènes lentes (promesse, métiers, prix, logo). Même moteur déterministe que le film complet :
   render(t) positionne tout à l'instant t. */
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
  const spring = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-7 * x) * Math.cos(11 * x));
  const V = new URLSearchParams(location.search).get('f') === 'v';
  const W = V ? 1080 : 1920, H = V ? 1920 : 1080, CX = W / 2, CY = H / 2;
  document.documentElement.classList.toggle('v', V);
  window.FPS = 30; window.TOTAL = 17.6;
  const T = { A: 0, B: 4.0, C: 8.2, D: 12.2 };
  window.CUTS = [T.B, T.C, T.D];
  const LAY = V
    ? { hx: 0, hy: 330, hs: 1.12, fanY: 1380, fanC: 1.0, fanS: .8, fanX: 345 }
    : { hx: 480, hy: 0, hs: 1, fanY: 718, fanC: .8, fanS: .68, fanX: 520 };

  const O = window.OFFRES, eur = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0€';
  [...$('#cChips').children].forEach((c, i) => { c.textContent = [`Express ${eur(O.express)}`, `Vitrine dès ${eur(O.vitrine[0][0])}`, `Boutique dès ${eur(O.boutique[0][0])}`][i]; });
  $('#cFoot').textContent = `Sérénité dès ${eur(O.serenite.essentiel.month)} / mois  ·  Parrainage : ${eur(O.filleul)} offerts`;
  const META = {};
  const tf = (el, o) => {
    el.style.transform = `translate3d(${o.x || 0}px,${o.y || 0}px,${o.z || 0}px) rotateX(${o.rx || 0}deg) rotateY(${o.ry || 0}deg) rotateZ(${o.r || 0}deg) scale(${o.s == null ? 1 : o.s})`;
    el.style.opacity = o.o == null ? 1 : o.o; el.style.filter = o.b ? `blur(${o.b}px)` : 'none';
  };
  const lum = (css) => { const m = css.match(/\d+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };
  function makePhone(name) {
    const el = document.createElement('div'); el.className = 'phone';
    const bg = (META[name] && META[name].bg) || 'rgb(246,247,249)', dark = lum(bg) < .45;
    el.innerHTML = `<div class="frame"></div><div class="screen" style="background:${bg}"><img class="shot" src="img/${name}.jpg" alt=""><div class="sb" style="background:${bg};color:${dark ? '#fff' : '#0b1220'}"><span>9:41</span><i></i></div></div><div class="island"></div><div class="glare"></div><div class="shadow"></div>`;
    el.shot = $('.shot', el); el.shot.style.top = '44px';
    el.scroll = (y) => { el.shot.style.transform = `translateY(${-y}px)`; };
    return el;
  }
  function split(el) {
    [...el.querySelectorAll('.ln')].forEach((ln) => {
      const txt = ln.textContent.trim().split(/\s+/); ln.textContent = '';
      txt.forEach((w, i) => { const s = document.createElement('span'); s.className = 'wd'; s.textContent = w; ln.append(s); });
    });
    return [...el.querySelectorAll('.wd')];
  }
  function words(list, t, t0, o = {}) {
    const st = o.stagger == null ? .1 : o.stagger, dur = o.dur || .9, y = o.y == null ? 70 : o.y, bl = o.blur == null ? 16 : o.blur;
    list.forEach((w, i) => { const p = eo4(P(t, t0 + i * st, t0 + i * st + dur)); tf(w, { y: (1 - p) * y, o: p, b: (1 - p) * bl, s: lerp(.97, 1, p) }); });
  }
  function out(el, t, a, b, dy = -50) { const p = eio(P(t, a, b)); if (p > 0) { el.style.opacity = 1 - p; el.style.transform = `translateY(${dy * p}px)`; el.style.filter = `blur(${p * 14}px)`; } }
  const reveal = (el, t, a, b, kind, cx, cy, ease = eio) => {
    const p = ease(P(t, a, b));
    if (t < a) { el.style.visibility = 'hidden'; return; }
    el.style.visibility = 'visible';
    if (p >= 1) el.style.clipPath = 'none';
    else if (kind === 'circle') el.style.clipPath = `circle(${p * 2600}px at ${cx}px ${cy}px)`;
    else if (kind === 'up') el.style.clipPath = `inset(${(1 - p) * 100}% 0 0 0)`;
  };

  const sc = { A: $('#sA'), B: $('#sB'), C: $('#sC'), D: $('#sD') };
  const wA = split($('#hTitle')), wB = split($('#bTitle'));
  const hero = $('#hero'), fan = $('#fan'); let heroPhone, fanPhones = [];
  const FAN = [['coiffeur', -1], ['restaurant', 0], ['photographe', 1]];

  function render(t) {
    sc.A.style.visibility = 'visible';
    reveal(sc.B, t, T.B, T.B + 1.1, 'circle', CX, H, eio5);
    reveal(sc.C, t, T.C, T.C + .95, 'up', 0, 0, eio5);
    reveal(sc.D, t, T.D, T.D + 1.1, 'circle', CX, CY, eio5);
    ['A', 'B', 'C'].forEach((k, i) => { if (t > [T.B, T.C, T.D][i] + 1.2) sc[k].style.visibility = 'hidden'; });
    document.querySelectorAll('.grid').forEach((g) => { g.style.transform = `translate(${-t * 14 % 72}px, ${-t * 9 % 72}px)`; });
    if (!heroPhone) return;

    /* ===== 1 · promesse : le téléphone monte, le texte arrive mot à mot, puis on lit tranquillement ===== */
    words(wA, t, .35, { stagger: .15, dur: 1.0 });
    tf($('#aKick'), { y: (1 - eo4(P(t, .2, .9))) * 30, o: eo3(P(t, .2, .9)) });
    tf($('#aLede'), { y: (1 - eo4(P(t, 1.7, 2.5))) * 40, o: eo3(P(t, 1.7, 2.5)), b: (1 - eo3(P(t, 1.7, 2.5))) * 10 });
    const rise = expo(P(t, .3, 1.9)), exit = eio5(P(t, 3.4, 4.5)), bob = Math.sin(t * 1.6) * 10 * rise;
    tf(hero, {
      x: lerp(LAY.hx * .6, LAY.hx, rise) * (1 - exit * .6), y: lerp(H - 60, LAY.hy, rise) + bob,
      ry: lerp(-40, -14, rise) + Math.sin(t * .9) * 4 + exit * 70, rx: lerp(8, 4, rise), r: lerp(6, 3, rise),
      s: lerp(.9, .98 * LAY.hs, rise) * (1 - exit * .3), o: 1 - eo3(P(t, 3.8, 4.5)),
    });
    heroPhone.scroll(lerp(0, 1500, eio(P(t, 1.8, 3.9))));
    out($('#aCopy'), t, 3.5, 4.2, -60);

    /* ===== 2 · trois téléphones, trois métiers ===== */
    const bl = t - T.B;
    $('#bKick').style.opacity = eo3(P(bl, .5, 1.1)); $('#bKick').style.transform = `translateY(${(1 - eo3(P(bl, .5, 1.1))) * -20}px)`;
    words(wB, t, T.B + .65, { stagger: .12, dur: .9 });
    fanPhones.forEach((f, i) => {
      const a = T.B + (f.k === 0 ? .9 : 1.15 + (f.k > 0 ? .15 : 0)), p = expo(P(t, a, a + 1.2)), ex = eio(P(t, T.C - .5, T.C + .2));
      const sz = f.k === 0 ? LAY.fanC : LAY.fanS, sw = Math.sin(t * 1.2 + i * 2) * 8;
      tf(f.el, { x: f.k * LAY.fanX * lerp(.55, 1, p), y: (LAY.fanY - CY) + (1 - p) * 900 + sw * p + (f.k === 0 ? 0 : 36), z: f.k === 0 ? 0 : -140,
        ry: f.k * -20 * (1 - (1 - p) * .4) + Math.sin(t * .8 + i) * 3, rx: (1 - p) * 12, s: sz * lerp(.88, 1, p), o: eo3(P(t, a, a + .5)) * (1 - ex) });
      f.el.scroll(lerp(0, f.k === 0 ? 900 : 560, eio(P(t, a + .6, a + 3.2))) + (f.k === 0 ? 0 : 0));
    });
    out($('#bTitle'), t, T.C - .7, T.C - .1, -30); out($('#bKick'), t, T.C - .7, T.C - .1, -20);

    /* ===== 3 · le prix ===== */
    const cl = t - T.C, pp = eo4(P(cl, .55, 2.1)), pop = spring(P(cl, .3, 1.3));
    $('#cVal').textContent = Math.round(O.pack * pp);
    tf($('#cKick'), { y: (1 - eo3(P(cl, .4, 1))) * -20, o: eo3(P(cl, .4, 1)) });
    tf($('#cPrice'), { s: lerp(.82, 1, pop), o: eo3(P(cl, .3, .8)), y: (1 - eo4(P(cl, .3, 1.2))) * 60 });
    tf($('#cLabel'), { y: (1 - eo4(P(cl, 2.0, 2.8))) * 40, o: eo3(P(cl, 2.0, 2.8)), b: (1 - eo3(P(cl, 2.0, 2.8))) * 10 });
    [...$('#cChips').children].forEach((c, i) => { const a = 2.8 + i * .35, p = expo(P(cl, a, a + .9)); tf(c, { y: (1 - p) * 60, s: lerp(.92, 1, p), o: eo3(P(cl, a, a + .5)) }); });
    tf($('#cFoot'), { o: eo3(P(cl, 3.5, 4.1)) * (1 - eio(P(t, T.D - .5, T.D + .1))), y: (1 - eo3(P(cl, 3.5, 4.1))) * 20 });
    ['#cKick', '#cPrice', '#cLabel', '#cChips'].forEach((s) => out($(s), t, T.D - .55, T.D + .1, -30));

    /* ===== 4 · logo ===== */
    const hl = t - T.D;
    const mp = spring(P(hl, .6, 1.8)), gdraw = eio(P(hl, 1.0, 2.4)), gfill = eo3(P(hl, 2.1, 2.7));
    const mark = $('#lMark'), g = $('#lG'); mark.style.transform = `scale(${lerp(.2, 1, mp)}) rotate(${lerp(-24, 0, mp)}deg)`; mark.style.opacity = eo3(P(hl, .5, 1));
    g.style.strokeDashoffset = 1 - gdraw; g.style.fill = `rgba(255,255,255,${gfill})`; g.style.strokeWidth = (1 - gfill) * .5;
    const lw = eio5(P(hl, 2.2, 3.5)), wd = $('#lWord'), logo = $('#logo');
    wd.style.maxWidth = (window.WORD_W * lw) + 'px'; logo.style.gap = ((V ? 26 : 42) * lw) + 'px'; wd.style.opacity = lw > 0 ? 1 : 0;
    [...wd.children].forEach((sp) => { sp.style.transform = `translateX(${-(1 - lw) * 120}px)`; });
    const tg = eo4(P(hl, 3.3, 4.1)), ur = eo4(P(hl, 3.8, 4.6));
    tf($('#lTag'), { y: (1 - tg) * 36, o: tg, b: (1 - tg) * 10 }); tf($('#lUrl'), { y: (1 - ur) * 36, o: ur, b: (1 - ur) * 10 });
    tf($('.g3', sc.D), { s: lerp(.8, 1.05, P(hl, 0, 5.4)), o: eo3(P(hl, .3, 2)) });
    $('#fade').style.opacity = Math.max(1 - eo3(P(t, 0, .45)), eo3(P(t, window.TOTAL - .8, window.TOTAL)));
  }
  window.render = render;

  (async function init() {
    await document.fonts.ready;
    Object.assign(META, await (await fetch('img/meta.json')).json());
    const fav = await (await fetch('../assets/favicon.svg')).text(); $('#lG').setAttribute('d', fav.split('<path d="')[1].split('"')[0]);
    const wd = $('#lWord'); wd.style.maxWidth = 'none'; window.WORD_W = wd.scrollWidth + 24; wd.style.maxWidth = '0px';
    heroPhone = makePhone('home'); hero.append(heroPhone);
    FAN.forEach(([n, k]) => { const el = makePhone(n); fan.append(el); fanPhones.push({ el, k }); });
    window.READY = true; render(0);
  })();
})();
