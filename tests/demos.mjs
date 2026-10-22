// Les six démos : chargement sous la CSP stricte de production, aucun débordement horizontal sur mobile, et une interaction clé par démo.
import assert from 'node:assert/strict';
import { launch, serve, DEMO_PAGES, ok } from './helpers.mjs';

const { base, close } = await serve({ csp: true });
const b = await launch();

async function open(path, viewport = { width: 1280, height: 800 }, opts = {}) {
  const ctx = await b.newContext({ viewport, ...opts }); const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  pg.on('requestfailed', (r) => errs.push('échec : ' + r.url()));
  await pg.goto(base + path, { waitUntil: 'networkidle' });
  return { pg, errs, ctx };
}

// 1. chaque démo : aucune erreur, aucune requête externe, pas de débordement à 360 px, bandeau « démo fictive », noindex
for (const path of DEMO_PAGES) {
  const { pg, errs, ctx } = await open(path, { width: 360, height: 740 });
  const external = []; pg.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) external.push(r.url()); });
  await pg.reload({ waitUntil: 'networkidle' });
  const over = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(over <= 1, `${path} : débordement horizontal de ${over}px à 360 px`);
  assert.deepEqual(errs, [], `${path} : ${errs.join(' | ')}`); assert.deepEqual(external, [], `${path} : requêtes externes ${external}`);
  assert.match(await pg.textContent('.dm-bar'), /Démo fictive/); assert.equal(await pg.getAttribute('meta[name=robots]', 'content'), 'noindex,follow');
  await ctx.close();
}
ok('démos : sans erreur, sans requête externe, sans débordement mobile, marquées « fictives » et noindex');

// 2. mouvement réduit : tout est visible sans animation
for (const path of DEMO_PAGES) {
  const { pg, ctx } = await open(path, { width: 1280, height: 800 }, { reducedMotion: 'reduce' });
  const hidden = await pg.evaluate(() => [...document.querySelectorAll('.rv, [data-split]')].filter((e) => !e.classList.contains('in')).length);
  assert.equal(hidden, 0, `${path} : ${hidden} éléments restent masqués avec prefers-reduced-motion`); await ctx.close();
}
ok('démos : avec « réduire les animations », tout le contenu est visible');

// 3. restaurant : filtres de la carte et réservation
{
  const { pg, errs, ctx } = await open('/demos/restaurant/');
  await pg.click('.tabs button[data-cat="plats"]'); await pg.click('.chip[data-tag="veg"]'); await pg.waitForTimeout(500);
  assert.equal(await pg.locator('#menu li:not([hidden])').count(), 1); ok('restaurant : onglet Plats + filtre végétarien = 1 plat');
  await pg.click('.chip[data-tag="veg"]'); await pg.click('.chip[data-tag="gf"]'); await pg.click('.chip[data-tag="mer"]'); await pg.waitForTimeout(300);
  assert.ok(await pg.locator('#menu li:not([hidden])').count() >= 1); ok('restaurant : filtres cumulés');
  await pg.click('#g-plus'); assert.equal(await pg.textContent('#g-out'), '3'); await pg.click('#res-next');
  await pg.waitForSelector('.slot:not([disabled])'); await pg.locator('.slot:not([disabled])').first().click(); await pg.click('#res-next');
  await pg.click('#res-next'); assert.match(await pg.textContent('#err-name'), /nom/); assert.match(await pg.textContent('#err-tel'), /10 chiffres/);
  await pg.fill('#res-name', 'Léa Martin'); await pg.fill('#res-tel', '06 12 34 56 78'); await pg.click('#res-next');
  assert.equal(await pg.locator('#res-done').isVisible(), true); assert.match(await pg.textContent('#done-text'), /Léa Martin/); ok('restaurant : réservation en 3 étapes avec validation');
  assert.deepEqual(errs, []); await ctx.close();
}

// 4. coiffeur : nuancier, accordéon, rendez-vous
{
  const { pg, ctx } = await open('/demos/coiffeur/');
  await pg.click('.sw-btn[aria-label="Cuivre"]'); assert.equal(await pg.textContent('#nu-name'), 'Cuivre'); assert.equal(await pg.getAttribute('.sw-btn[aria-label="Cuivre"]', 'aria-checked'), 'true'); ok('coiffeur : le nuancier change la teinte et les infos');
  await pg.focus('.sw-btn[aria-label="Cuivre"]'); await pg.keyboard.press('ArrowRight'); assert.equal(await pg.textContent('#nu-name'), 'Rouge acajou'); ok('coiffeur : nuancier au clavier');
  await pg.click('#acc .acc-item:nth-child(2) button'); assert.equal(await pg.getAttribute('#acc .acc-item:nth-child(2) button', 'aria-expanded'), 'true'); ok('coiffeur : accordéon');
  await pg.click('#r-presta [role=radio]:nth-child(3)'); await pg.waitForSelector('#r-times button:not([disabled])'); await pg.locator('#r-times button:not([disabled])').first().click();
  await pg.click('#rdv-form [type=submit]'); assert.match(await pg.textContent('#e-name'), /nom/);
  await pg.fill('#r-name', 'Paul'); await pg.fill('#r-tel', '0612345678'); await pg.click('#rdv-form [type=submit]'); assert.equal(await pg.locator('#r-done').isVisible(), true); ok('coiffeur : rendez-vous'); await ctx.close();
}

// 5. photographe : filtre, visionneuse, simulateur
{
  const { pg, errs, ctx } = await open('/demos/photographe/');
  const all = await pg.locator('#grid .tile').count(); assert.equal(all, 8);
  await pg.click('.filters [data-f="lumiere"]'); const lum = await pg.locator('#grid .tile:not([hidden])').count(); assert.ok(lum > 0 && lum < all); ok('photographe : filtre « Lumière »');
  await pg.click('.filters [data-f="all"]'); await pg.locator('#grid .tile button').first().click(); assert.equal(await pg.locator('#lb[open]').count(), 1);
  const t1 = await pg.textContent('#lb-cap'); await pg.keyboard.press('ArrowRight'); assert.notEqual(await pg.textContent('#lb-cap'), t1);
  await pg.keyboard.press('Escape'); assert.equal(await pg.locator('#lb[open]').count(), 0); ok('photographe : visionneuse (flèches, Échap)');
  const tot1 = await pg.textContent('#t-tot'); await pg.click('#t-fmt button:nth-child(3)'); await pg.click('#t-fin button:nth-child(2)'); assert.notEqual(await pg.textContent('#t-tot'), tot1); ok('photographe : le simulateur de tirages recalcule le total');
  assert.deepEqual(errs, []); await ctx.close();
}

// 6. gîte : calendrier, séjour, règles de séjour minimum
{
  const { pg, ctx } = await open('/demos/gite/');
  await pg.click('#c-next'); await pg.click('#c-next');
  const free = pg.locator('#c-grid .day:not([disabled])'); assert.ok(await free.count() > 5);
  // trouve deux jours libres consécutifs distants d'au moins 3 nuits, sans date indisponible entre les deux
  const keys = await pg.$$eval('#c-grid .day', (els) => els.map((e) => ({ k: +e.dataset.k, off: e.disabled })));
  let a = null, bk = null;
  for (let i = 0; i < keys.length - 4 && !a; i++) if (!keys[i].off && keys.slice(i, i + 5).every((x) => !x.off)) { a = keys[i].k; bk = keys[i + 4].k; }
  assert.ok(a, 'au moins 4 jours libres consécutifs');
  await pg.click(`#c-grid .day[data-k="${a}"]`); await pg.click(`#c-grid .day[data-k="${bk}"]`);
  assert.equal(await pg.locator('#s-box').isVisible(), true); assert.match(await pg.textContent('#s-lines'), /Total/);
  const t1 = await pg.textContent('#s-lines'); await pg.click('#v-p'); assert.notEqual(await pg.textContent('#s-lines'), t1); ok('gîte : calendrier, total du séjour et taxe selon les voyageurs');
  await pg.click('#places button[data-p="port"]'); assert.equal(await pg.locator('.pt.on').getAttribute('data-p'), 'port'); ok('gîte : plan interactif'); await ctx.close();
}

// 7. club : agenda, filtre, billetterie
{
  const { pg, errs, ctx } = await open('/demos/club/');
  const n = await pg.locator('#events .ev').count(); assert.equal(n, 7);
  await pg.click('.filters [data-f="club"]'); const c = await pg.locator('#events .ev:not([hidden])').count(); assert.ok(c > 0 && c < n); ok('club : filtre de l’agenda');
  await pg.click('.filters [data-f="all"]'); await pg.locator('#events .ev .btn:not([disabled])').first().click(); assert.equal(await pg.locator('#tk[open]').count(), 1);
  const before = await pg.textContent('#tk-tot'); await pg.click('#q-p'); assert.notEqual(await pg.textContent('#tk-tot'), before);
  await pg.click('#tk-go'); assert.match(await pg.textContent('#tk-e'), /e-mail/); await pg.fill('#tk-mail', 'lea@example.fr'); await pg.click('#tk-go'); assert.equal(await pg.locator('#tk-done').isVisible(), true); ok('club : billetterie (total, validation, confirmation)');
  assert.ok(await pg.locator('#events .ev .btn[disabled]').count() >= 1); ok('club : une date complète est non réservable');
  assert.deepEqual(errs, []); await ctx.close();
}

// 8. btp : comparateur avant/après, estimateur
{
  const { pg, errs, ctx } = await open('/demos/btp/');
  await pg.locator('#ba-range').focus(); await pg.evaluate(() => { const r = document.querySelector('#ba-range'); r.value = 80; r.dispatchEvent(new Event('input')); });
  assert.equal(await pg.evaluate(() => document.querySelector('#ba').style.getPropertyValue('--pos')), '80%'); ok('btp : le curseur avant/après déplace la comparaison');
  const v1 = await pg.textContent('#e-v'); await pg.click('#e-type button:nth-child(3)'); assert.notEqual(await pg.textContent('#e-v'), v1); await pg.click('#e-fin button:nth-child(3)'); ok('btp : l’estimateur recalcule la fourchette');
  await pg.click('#e-go'); assert.match(await pg.inputValue('#d-msg'), /salle de bain/); ok('btp : l’estimation préremplit le devis');
  await pg.fill('#d-name', 'Alex'); await pg.fill('#d-contact', 'alex@example.fr'); await pg.click('#dv-form [type=submit]'); assert.equal(await pg.locator('#d-done').isVisible(), true);
  assert.deepEqual(errs, []); await ctx.close();
}

// 9. anciennes adresses : redirection vers les nouvelles
for (const [old, now] of [['/club-demo.html', '/demos/club/'], ['/btp-demo.html', '/demos/btp/']]) {
  const { pg, ctx } = await open(old); await pg.waitForURL('**' + now); assert.ok(pg.url().endsWith(now)); await ctx.close();
}
ok('anciennes adresses des démos : redirigées');

// 10. galerie /demos/
{
  const { pg, ctx } = await open('/demos/'); assert.equal(await pg.locator('.project-grid .project').count(), 6); ok('galerie : six démos listées'); await ctx.close();
}
await b.close(); close();
