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
await shot('studioglsc-banniere-1500x500.png', 1500, 500, `<div style="width:1500px;height:500px;background:#0B1220;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:50px 50px;position:relative;overflow:hidden"><div style="position:absolute;right:-180px;top:-260px;width:760px;height:760px;border-radius:50%;background:radial-gradient(closest-side,rgba(36,71,214,.75),transparent)"></div><div style="position:absolute;left:120px;top:100px;width:${Math.round(900 * 1)}px;height:${Math.round(900 * 64 / LOGO_W)}px">${svg('studioglsc-logo-fond-sombre.svg')}</div><div style="position:absolute;left:124px;top:352px;font:600 30px/1.2 system-ui,sans-serif;color:#aebfff;letter-spacing:.01em">Sites vitrines clairs et rapides · Bretagne</div></div>`, false);
await b.close();
py('zip');
