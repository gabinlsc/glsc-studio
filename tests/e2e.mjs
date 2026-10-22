// Parcours de bout en bout dans Chromium : accueil (formulaire en étapes, estimation, démos, sommaire), sous-pages (menu, thème, données structurées), 404 (recherche).
import assert from 'node:assert/strict';
import { launch, ok, serve } from './helpers.mjs';

const { base, close } = await serve({ csp: true });
const b = await launch();

// ---------------- accueil
const home = await b.newContext({ viewport: { width: 1440, height: 900 } });
await home.route(/cdn\.tailwindcss|fonts\.g/, (r) => r.abort());
let pg = await home.newPage(); const errs = [];
pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => m.type() === 'error' && !/ERR_FAILED|net::|503/.test(m.text()) && errs.push(m.text()));
await pg.goto(base + '/', { waitUntil: 'networkidle' });
// estimation
assert.equal(await pg.textContent('#est-total'), '400 €'); ok('estimation par défaut : 400 €');
await pg.check('input[name="est-host"][value="year"]', { force: true }); assert.equal((await pg.textContent('#est-total')).replace(/\s/g, ' '), '700 €'); ok('400 € + hébergement annuel = 700 €');
await pg.check('input[name="est-host"][value="month"]', { force: true }); assert.equal((await pg.textContent('#est-total')).replace(/\s/g, ' '), '760 €'); ok('400 € + hébergement mensuel (12 × 30) = 760 €');
await pg.check('input[name="est-site"][value="multi"]', { force: true }); assert.match(await pg.textContent('#est-total'), /360 € \+ devis/); ok('multi-pages : sur devis + hébergement');
// formulaire : erreurs en ligne
await pg.evaluate(() => document.querySelector('#contact').scrollIntoView());
assert.equal(await pg.locator('#step-back').isVisible(), false); assert.equal(await pg.locator('#step-send').isVisible(), false); ok('étape 1 : seul « Continuer » est visible');
await pg.click('#step-next'); assert.match(await pg.textContent('[data-error="activity"]'), /Choisissez/); ok('étape 1 : erreur si rien n’est choisi');
await pg.check('input[name=activity][value="Commerce"]', { force: true }); await pg.click('#step-next');
assert.equal(await pg.textContent('#step-label'), 'Étape 2 sur 4'); ok('étape 2');
await pg.check('input[name=service][value="One-Page Express"]', { force: true }); await pg.click('#step-next');
await pg.check('input[name=timing][value="Dans le mois"]', { force: true }); await pg.click('#step-next');
assert.equal(await pg.textContent('#step-label'), 'Étape 4 sur 4'); assert.equal(await pg.locator('#step-send').isVisible(), true); ok('étape 4 : bouton Envoyer');
await pg.click('#step-send'); assert.match(await pg.textContent('#err-name'), /nom/); assert.match(await pg.textContent('#err-email'), /e-mail/); ok('erreurs nom et e-mail en ligne');
await pg.fill('#form-name', 'Léa Martin'); await pg.fill('#form-email', 'lea@@x'); await pg.click('#step-send'); assert.match(await pg.textContent('#err-email'), /valide/); ok('e-mail invalide refusé');
await pg.fill('#form-email', 'lea@example.fr');
await pg.click('#step-back'); assert.equal(await pg.textContent('#step-label'), 'Étape 3 sur 4'); await pg.click('#step-next'); ok('retour puis avance conservent les réponses');
await pg.route('mailto:**', (r) => r.abort()).catch(() => {});
await pg.route('**/api/contact', (r) => r.fulfill({ status: 503, body: '{}' }));
await pg.click('#step-send'); await pg.waitForTimeout(300);
assert.equal(await pg.locator('#form-done').isVisible(), true); assert.match(await pg.textContent('#done-title'), /Merci Léa/); assert.equal(await pg.locator('#done-fallback').isVisible(), true);
const copy = await pg.inputValue('#done-copy'); assert.match(copy, /Activité : Commerce/); assert.match(copy, /Besoin : One-Page Express/); assert.match(copy, /Léa Martin/); ok('service indisponible : repli e-mail + message à copier');
await pg.unroute('**/api/contact'); let posted = null; await pg.route('**/api/contact', (r) => { posted = r.request().postDataJSON(); r.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true}' }); });
await pg.click('#done-restart'); assert.equal(await pg.locator('#contact-form').isVisible(), true); assert.equal(await pg.textContent('#step-label'), 'Étape 1 sur 4'); ok('nouvelle demande réinitialise');
await pg.check('input[name=activity][value="Commerce"]', { force: true }); await pg.click('#step-next'); await pg.check('input[name=service][value="One-Page Express"]', { force: true }); await pg.click('#step-next'); await pg.check('input[name=timing][value="Dans le mois"]', { force: true }); await pg.click('#step-next');
await pg.fill('#form-name', 'Léa Martin'); await pg.fill('#form-email', 'lea@example.fr'); await pg.click('#step-send'); await pg.waitForSelector('#form-done:not([hidden])');
assert.equal(await pg.locator('#done-fallback').isVisible(), false); assert.equal(posted.email, 'lea@example.fr'); assert.equal(posted.service, 'One-Page Express'); ok('service disponible : demande envoyée à /api/contact, sans repli');
await pg.click('#done-restart');
// piège anti-robot : rien ne s'affiche
await pg.check('input[name=activity][value="Commerce"]', { force: true }); await pg.click('#step-next'); await pg.check('input[name=service][value="One-Page Express"]', { force: true }); await pg.click('#step-next'); await pg.check('input[name=timing][value="Dans le mois"]', { force: true }); await pg.click('#step-next');
await pg.fill('#form-name', 'Bot'); await pg.fill('#form-email', 'bot@example.fr'); await pg.evaluate(() => { document.querySelector('input[name=website]').value = 'http://spam'; }); await pg.click('#step-send');
assert.equal(await pg.locator('#form-done').isVisible(), false); ok('champ piège rempli : rien n’est envoyé');
// démos
await pg.evaluate(() => document.querySelector('.demo-lab').scrollIntoView());
assert.equal(await pg.locator('#demo-screen iframe').count(), 0); await pg.click('#demo-launch'); assert.equal(await pg.locator('#demo-screen iframe').count(), 1); ok('démo chargée seulement au clic');
assert.equal(await pg.locator('.seg button').count(), 6); await pg.click('.seg button:nth-child(6)'); assert.match(await pg.getAttribute('#demo-screen iframe', 'src'), /demos\/btp\//); assert.match(await pg.getAttribute('#demo-open', 'href'), /demos\/btp\//); ok('changement de démo (six onglets)');
// rail
assert.equal(await pg.locator('#rail').isVisible(), true); await pg.evaluate(() => document.querySelector('#engagements').scrollIntoView()); await pg.waitForTimeout(600);
assert.equal(await pg.locator('#rail a[aria-current="location"]').getAttribute('href'), '#engagements'); ok('sommaire latéral suit la section');
// bouton rendez-vous : sans lien, mailto
assert.match(await pg.getAttribute('[data-booking-link]', 'href'), /^mailto:/); ok('rendez-vous : repli par e-mail tant que BOOKING_URL est vide');
// estimation -> formulaire
await pg.check('input[name="est-site"][value="express"]', { force: true }); await pg.check('input[name="est-host"][value="none"]', { force: true });
await pg.evaluate(() => document.querySelector('#estimate').scrollIntoView()); await pg.click('#est-cta'); await pg.waitForTimeout(400);
assert.equal(await pg.locator('input[name=service][value="One-Page Express"]').isChecked(), true); ok('« Demander ce devis » préremplit le formulaire');
assert.deepEqual(errs, []); ok('aucune erreur JS');
await home.close();

// ---------------- sous-pages et 404
let ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); pg = await ctx.newPage(); const errs2 = [];
pg.on('pageerror', (e) => errs2.push(e.message)); pg.on('console', (m) => m.type() === 'error' && !/404|net::ERR/.test(m.text()) && errs2.push(m.text()));
await pg.goto(base + '/blog/site-rapide-mobile/');
await pg.click('#menu-toggle'); assert.equal(await pg.locator('#mobile-menu').isVisible(), true); ok('sous-page : menu mobile s’ouvre');
assert.equal(await pg.locator('#mobile-menu a[href="/#offres"]').count(), 1); ok('les liens du menu pointent vers l’accueil (/#offres)');
await pg.keyboard.press('Escape');
await pg.click('#theme-toggle'); await pg.waitForTimeout(500); assert.equal(await pg.getAttribute('html', 'data-theme'), 'dark'); ok('sous-page : thème sombre');
assert.equal(await pg.locator('.breadcrumb a').count() >= 2, true); ok('fil d’Ariane');
const ld = await pg.$$eval('script[type="application/ld+json"]', (n) => n.map((x) => JSON.parse(x.textContent)['@type'])); assert.ok(ld.includes('Article') && ld.includes('BreadcrumbList')); ok('JSON-LD : ' + ld.join(', '));
assert.deepEqual(errs2, []); ok('aucune erreur JS sur la sous-page');
await ctx.close();
// 404 avec suggestion
ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); pg = await ctx.newPage();
await pg.goto(base + '/tarifs-lorient'); await pg.waitForSelector('#nf-search:not([hidden])');
const first = await pg.locator('#nf-results a').first().textContent(); assert.ok(first && first.length > 3); ok('404 : suggestion pour /tarifs-lorient → ' + first.slice(0, 40));
await pg.fill('#nf-q', 'plombier'); await pg.waitForTimeout(200); assert.match(await pg.locator('#nf-results a').first().getAttribute('href'), /artisans-btp/); ok('recherche « plombier » → page artisans & BTP');
await pg.fill('#nf-q', 'zzzzqq'); await pg.waitForTimeout(200); assert.match(await pg.textContent('#nf-hint'), /Aucune page/); ok('recherche sans résultat : message');
await ctx.close();
// accueil : pied de page enrichi, nav
ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); pg = await ctx.newPage(); await pg.goto(base + '/');
assert.equal(await pg.locator('.footer-cols a').count() >= 15, true); ok('accueil : colonnes de liens du pied de page');
assert.equal(await pg.locator('#desktop-nav a').count(), 7); ok('accueil : 7 liens de navigation');
await ctx.close(); await b.close(); close();
