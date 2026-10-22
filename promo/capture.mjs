// Captures d'écran réelles du site et des démos (390 px de large, ×2) utilisées comme écrans de téléphone dans la vidéo.
//   CHROMIUM_PATH=… node promo/capture.mjs
import { serve, launch, ROOT } from '../tests/helpers.mjs';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
const { base, close } = await serve({ csp: false });
const b = await launch();
const PAGES = { home: '/', restaurant: '/demos/restaurant/', coiffeur: '/demos/coiffeur/', photographe: '/demos/photographe/', gite: '/demos/gite/', club: '/demos/club/', btp: '/demos/btp/', suivi: '/suivi/' };
const meta = {};
const MARKS = { home: ['#services', '#offres', '#realisations'], restaurant: ['#carte', '#reserver'], coiffeur: ['#nuancier', '#rdv'], photographe: ['#galerie'], gite: ['#sejour', '#tarifs'], club: ['#agenda'], btp: ['#chantiers', '#estimer'] };
for (const [name, path] of Object.entries(PAGES)) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pg = await ctx.newPage(); await pg.goto(base + path, { waitUntil: 'networkidle' });
  await pg.addStyleTag({ content: '.dm-bar,.m-cta,.fx-top,.fx-toast{display:none!important} html{scroll-behavior:auto!important}' });
  const H = await pg.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 380) { await pg.evaluate((v) => scrollTo(0, v), y); await pg.waitForTimeout(90); }
  await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(1800);
  const h = Math.min(await pg.evaluate(() => document.documentElement.scrollHeight), 5200);
  await pg.screenshot({ path: join(ROOT, `promo/img/${name}.jpg`), type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 390, height: h }, fullPage: true });
  meta[name] = await pg.evaluate((marks) => ({ bg: getComputedStyle(document.body).backgroundColor, top: Object.fromEntries(marks.map((m) => [m, Math.round(document.querySelector(m).getBoundingClientRect().top + scrollY)])) }), MARKS[name] || []);
  console.log(name, h, JSON.stringify(meta[name])); await ctx.close();
}
writeFileSync(join(ROOT, 'promo/img/meta.json'), JSON.stringify(meta, null, 1));
await b.close(); close();
