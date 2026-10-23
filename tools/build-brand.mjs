// Kit de marque : SVG (python), PNG (Chromium), archive .zip (python).
//   CHROMIUM_PATH=… node tools/build-brand.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch, ROOT } from '../tests/helpers.mjs';

const OUT = join(ROOT, 'assets/brand');
const py = (...a) => execFileSync('python3', ['-I', join(ROOT, 'tools/build-brand.py'), ...a], { stdio: 'inherit' });
py('svg');
const svg = (n) => readFileSync(join(OUT, n), 'utf8').replace(/ width="[\d.]+" height="[\d.]+"/, ' width="100%" height="100%"');
const LOGO_W = parseFloat(readFileSync(join(OUT, '.logo-width'), 'utf8'));

const b = await launch(); const ctx = await b.newContext({ deviceScaleFactor: 1 });
async function shot(name, w, h, html, transparent = true) {
  const pg = await ctx.newPage(); await pg.setViewportSize({ width: w, height: h });
  await pg.setContent(`<!doctype html><meta charset=utf-8><style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:transparent}svg{display:block}</style>${html}`);
  await pg.screenshot({ path: join(OUT, name), omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } }); await pg.close(); console.log(name);
}
for (const s of [1024, 512, 180]) await shot(`studioglsc-monogramme-${s}.png`, s, s, `<div style="width:${s}px;height:${s}px">${svg('studioglsc-monogramme.svg')}</div>`);
const lw = 2400, lh = Math.round(lw * 64 / LOGO_W);
await shot('studioglsc-logo-2400.png', lw, lh, `<div style="width:${lw}px;height:${lh}px">${svg('studioglsc-logo.svg')}</div>`);
await shot('studioglsc-logo-fond-sombre-2400.png', lw, lh, `<div style="width:${lw}px;height:${lh}px">${svg('studioglsc-logo-fond-sombre.svg')}</div>`);
// avatar carré (les réseaux sociaux le recadrent en rond : le G reste dans la zone sûre)
await shot('studioglsc-avatar-1080.png', 1080, 1080, `<div style="width:1080px;height:1080px;background:#2447D6;display:grid;place-items:center"><div style="width:560px;height:620px">${svg('studioglsc-lettre-blanc.svg')}</div></div>`, false);
// bannière 1500 × 500
await shot('studioglsc-banniere-1500x500.png', 1500, 500, `<div style="width:1500px;height:500px;background:#0B1220;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:50px 50px;position:relative;overflow:hidden"><div style="position:absolute;right:-180px;top:-260px;width:760px;height:760px;border-radius:50%;background:radial-gradient(closest-side,rgba(36,71,214,.75),transparent)"></div><div style="position:absolute;left:120px;top:100px;width:${Math.round(900 * 1)}px;height:${Math.round(900 * 64 / LOGO_W)}px">${svg('studioglsc-logo-fond-sombre.svg')}</div><div style="position:absolute;left:124px;top:352px;font:600 30px/1.2 system-ui,sans-serif;color:#ffffff;letter-spacing:.01em">Sites vitrines clairs et rapides · Bretagne</div></div>`, false);
// image de partage 1200 × 630 (le prix affiché doit suivre le site : modifier ici puis relancer)
{
  const { writeFileSync, mkdtempSync } = await import('node:fs'); const { tmpdir } = await import('node:os');
  const dir = mkdtempSync(join(tmpdir(), 'og-')); const f = (n) => 'file://' + join(ROOT, 'assets/fonts', n);
  const html = `<!doctype html><meta charset=utf-8><style>
  @font-face{font-family:Inter;font-weight:400;src:url(${f('inter-400.woff2')})}@font-face{font-family:Inter;font-weight:600;src:url(${f('inter-600.woff2')})}@font-face{font-family:ID;font-weight:700;src:url(${f('inter-display-700.woff2')})}
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{background:#f6f7f9;background-image:linear-gradient(#e6e9f0 1px,transparent 1px),linear-gradient(90deg,#e6e9f0 1px,transparent 1px);background-size:40px 40px;font-family:Inter;color:#0b1220;position:relative}
  .bar{position:absolute;left:0;right:0;top:0;height:9px;background:#2447d6}
  .brand{position:absolute;left:72px;top:72px;display:flex;align-items:center;gap:16px;font:700 32px/1 ID;letter-spacing:-.02em}.brand svg{width:50px;height:50px}.brand b{color:#2447d6}
  h1{position:absolute;left:72px;top:176px;margin:0;font:700 112px/1.02 ID;letter-spacing:-.04em}h1 span{display:block;color:#2447d6}
  p{position:absolute;left:72px;top:424px;margin:0;font:400 30px/1.3 Inter;color:#566074}
  ul{position:absolute;left:72px;top:510px;margin:0;padding:0;display:flex;gap:16px;list-style:none}li{padding:14px 18px;border:1.5px solid #cfd5e1;border-radius:999px;background:#fff;font:600 22px/1 Inter}
  </style><div class=bar></div><div class=brand>${readFileSync(join(OUT, 'studioglsc-monogramme.svg'), 'utf8').replace(/ width="[\d.]+" height="[\d.]+"/, '')}<span>Studio<b>GLSC</b></span></div>
  <h1>Un site web<span>à votre image.</span></h1><p>Sites vitrines rapides et adaptés au mobile, en Bretagne.</p>
  <ul><li>Première version sous 48 h</li><li>Express · 590 €</li><li>Sans abonnement obligatoire</li></ul>`;
  writeFileSync(join(dir, 'og.html'), html);
  const pg = await ctx.newPage(); await pg.setViewportSize({ width: 1200, height: 630 }); await pg.goto('file://' + join(dir, 'og.html')); await pg.waitForTimeout(400);
  await pg.screenshot({ path: join(ROOT, 'assets/img/og.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } }); console.log('og.png');
}
await b.close();
py('zip');
