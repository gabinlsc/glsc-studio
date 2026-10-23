// Centre de marque : fichiers téléchargeables, copie des couleurs, aperçu sur fond, essai typographique, mobile.
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { launch, serve, ROOT, ok } from './helpers.mjs';

const { base, close } = await serve({ csp: true });
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, permissions: ['clipboard-read', 'clipboard-write'] }); const pg = await ctx.newPage(); const errs = [];
pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
const external = []; pg.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) external.push(r.url()); });
await pg.goto(base + '/marque/', { waitUntil: 'networkidle' });

// tous les fichiers proposés au téléchargement existent
const hrefs = await pg.$$eval('a[download]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
assert.ok(hrefs.length >= 13, `${hrefs.length} liens de téléchargement`);
for (const h of hrefs) assert.ok(existsSync(join(ROOT, h)) && statSync(join(ROOT, h)).size > 500, `fichier manquant ou vide : ${h}`);
ok(`marque : ${hrefs.length} fichiers téléchargeables présents`);
// le zip contient les SVG et les PNG
const { execFileSync } = await import('node:child_process');
const listing = execFileSync('python3', ['-I', '-c', 'import sys,zipfile;print("\\n".join(zipfile.ZipFile(sys.argv[1]).namelist()))', join(ROOT, 'assets/brand/studioglsc-kit-de-marque.zip')]).toString();
for (const n of ['LISEZMOI.txt', 'couleurs.css', 'svg/studioglsc-logo.svg', 'svg/studioglsc-monogramme.svg', 'png/studioglsc-avatar-1080.png', 'png/studioglsc-logo-2400.png']) assert.ok(listing.includes(n), `${n} absent du zip`);
ok('marque : le kit .zip contient logos, palette et règles');

// couleurs : application via CSSOM, copie dans le presse-papiers
const bg = await pg.$eval('.bk-sw-fill', (e) => getComputedStyle(e).backgroundColor); assert.equal(bg, 'rgb(36, 71, 214)'); ok('marque : pastille de couleur correcte sous CSP');
await pg.click('.bk-sw-chip'); assert.equal(await pg.evaluate(() => navigator.clipboard.readText()), '#2447D6'); assert.match(await pg.textContent('.fx-toast'), /copiée/); ok('marque : clic sur une couleur copie son code');
// aperçu sur fond
await pg.click('[data-bgset="dark"]'); assert.ok((await pg.$$eval('.bk-stage', (s) => s.every((x) => x.classList.contains('dark'))))); await pg.click('[data-bgset="auto"]'); assert.ok((await pg.$$eval('.bk-stage', (s) => s.some((x) => x.classList.contains('light'))))); ok('marque : aperçu des logos sur fond');
// essai typographique
await pg.evaluate(() => { document.querySelector('#type-demo').textContent = ''; document.querySelector('#type-demo').dispatchEvent(new Event('blur')); }); assert.match(await pg.textContent('#type-demo'), /Un site web/); ok('marque : l’essai typographique revient au texte d’origine');
// sommaire
assert.equal(await pg.getAttribute('meta[name=robots]', 'content'), 'noindex,follow');
assert.deepEqual(errs, []); assert.deepEqual(external, []); ok('marque : aucune erreur, aucune requête externe');
// mobile
const m = await b.newContext({ viewport: { width: 360, height: 740 } }); const mp = await m.newPage(); await mp.goto(base + '/marque/', { waitUntil: 'networkidle' });
const over = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.ok(over <= 1, `débordement ${over}px`); ok('marque : pas de débordement horizontal à 360 px');
await b.close(); close();
