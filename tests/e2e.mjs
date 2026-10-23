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
const tot = async () => (await pg.textContent('#est-total')).replace(/\s/g, ' ');
assert.equal(await tot(), '590 €'); ok('estimation par défaut : Express 590 €');
const radio = (n, v) => pg.check(`input[name="${n}"][value="${v}"]`, { force: true });
await radio('est-plan', 'essentiel'); assert.equal(await pg.locator('fieldset[data-for-plan]').isVisible(), true);
await radio('est-bill', 'year'); assert.equal(await tot(), '880 €'); ok('Express + Sérénité Essentiel à l’année (290 €) = 880 €');
await radio('est-bill', 'month'); assert.equal(await tot(), '938 €'); ok('Express + Sérénité Essentiel au mois (12 × 29 €) = 938 €');
await radio('est-plan', 'plus'); await radio('est-bill', 'year'); assert.equal(await tot(), '1 180 €'); ok('Express + Sérénité Plus à l’année (590 €) = 1 180 €');
await radio('est-plan', 'none'); assert.equal(await pg.locator('fieldset[data-for-plan]').isVisible(), false);
await pg.check('input[name="est-opt"][value="google"]', { force: true }); assert.equal(await tot(), '740 €'); ok('option fiche Google : + 150 €');
await pg.check('input[name="est-ref"]', { force: true }); assert.equal(await tot(), '690 €'); ok('parrainage : − 50 €');
await pg.uncheck('input[name="est-ref"]', { force: true });
await radio('est-site', 'pack'); assert.equal(await tot(), '790 €'); assert.equal(await pg.locator('input[name="est-opt"][value="google"]').isVisible(), false); assert.equal(await pg.locator('input[name="est-opt"][value="google"]').isChecked(), false); ok('Pack Lancement : 790 €, options déjà incluses masquées');
await radio('est-site', 'vitrine'); assert.equal(await pg.locator('fieldset[data-for="vitrine"]').isVisible(), true); assert.equal(await tot(), '990 € – 1 190 €'); ok('vitrine : estimation de départ dès 990 €');
await radio('est-pages', '2'); assert.equal(await tot(), '1 490 € – 1 990 €'); ok('vitrine : 7 à 10 pages');
await pg.check('input[name="est-opt"][value="page"]', { force: true }); assert.equal(await tot(), '1 610 € – 2 110 €'); assert.equal(await pg.locator('input[name="est-opt"][value="google"]').isVisible(), false); ok('vitrine : page supplémentaire ajoutée, fiche Google déjà incluse');
await pg.uncheck('input[name="est-opt"][value="page"]', { force: true });
await radio('est-site', 'boutique'); assert.equal(await pg.locator('fieldset[data-for="boutique"]').isVisible(), true); assert.equal(await tot(), '1 490 € – 1 890 €'); ok('boutique : dès 1 490 €');
await radio('est-prod', '2'); assert.equal(await tot(), 'Dès 2 590 €'); await radio('est-plan', 'croissance'); await radio('est-bill', 'year'); assert.equal(await tot(), 'Dès 3 580 €'); ok('boutique : plus de 50 produits + Sérénité Croissance annuelle');
await radio('est-plan', 'none'); await radio('est-site', 'express');
// formulaire : erreurs en ligne
await pg.evaluate(() => document.querySelector('#contact').scrollIntoView());
assert.equal(await pg.locator('#step-back').isVisible(), false); assert.equal(await pg.locator('#step-send').isVisible(), false); ok('étape 1 : seul « Continuer » est visible');
await pg.click('#step-next'); assert.match(await pg.textContent('[data-error="activity"]'), /Choisissez/); ok('étape 1 : erreur si rien n’est choisi');
await pg.check('input[name=activity][value="Commerce"]', { force: true }); await pg.click('#step-next');
assert.equal(await pg.textContent('#step-label'), 'Étape 2 sur 4'); ok('étape 2');
await pg.check('input[name=service][value="Express"]', { force: true }); await pg.click('#step-next');
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
const copy = await pg.inputValue('#done-copy'); assert.match(copy, /Activité : Commerce/); assert.match(copy, /Besoin : Express/); assert.match(copy, /Léa Martin/); ok('service indisponible : repli e-mail + message à copier');
await pg.unroute('**/api/contact'); let posted = null; await pg.route('**/api/contact', (r) => { posted = r.request().postDataJSON(); r.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true}' }); });
await pg.click('#done-restart'); assert.equal(await pg.locator('#contact-form').isVisible(), true); assert.equal(await pg.textContent('#step-label'), 'Étape 1 sur 4'); ok('nouvelle demande réinitialise');
await pg.check('input[name=activity][value="Commerce"]', { force: true }); await pg.click('#step-next'); await pg.check('input[name=service][value="Express"]', { force: true }); await pg.click('#step-next'); await pg.check('input[name=timing][value="Dans le mois"]', { force: true }); await pg.click('#step-next');
await pg.fill('#form-name', 'Léa Martin'); await pg.fill('#form-email', 'lea@example.fr'); await pg.click('#step-send'); await pg.waitForSelector('#form-done:not([hidden])');
assert.equal(await pg.locator('#done-fallback').isVisible(), false); assert.equal(posted.email, 'lea@example.fr'); assert.equal(posted.service, 'Express'); ok('service disponible : demande envoyée à /api/contact, sans repli');
await pg.click('#done-restart');
// piège anti-robot : rien ne s'affiche
await pg.check('input[name=activity][value="Commerce"]', { force: true }); await pg.click('#step-next'); await pg.check('input[name=service][value="Express"]', { force: true }); await pg.click('#step-next'); await pg.check('input[name=timing][value="Dans le mois"]', { force: true }); await pg.click('#step-next');
await pg.fill('#form-name', 'Bot'); await pg.fill('#form-email', 'bot@example.fr'); await pg.evaluate(() => { document.querySelector('input[name=website]').value = 'http://spam'; }); await pg.click('#step-send');
assert.equal(await pg.locator('#form-done').isVisible(), false); ok('champ piège rempli : rien n’est envoyé');
// démos
await pg.evaluate(() => document.querySelector('#showcase').scrollIntoView());
await pg.waitForSelector('#demo-screen iframe', { timeout: 5000 }); assert.match(await pg.getAttribute('#demo-screen iframe', 'src'), /demos\/restaurant\//); ok('démo chargée automatiquement quand la zone est visible');
assert.equal(await pg.locator('.sc-tab').count(), 6); await pg.click('.sc-tab:nth-child(6)'); await pg.waitForFunction(() => /demos\/btp\//.test(document.querySelector('#demo-screen iframe:last-of-type')?.src || ''));
assert.match(await pg.getAttribute('#demo-open', 'href'), /demos\/btp\//); assert.equal(await pg.getAttribute('.sc-tab:nth-child(6)', 'aria-selected'), 'true'); ok('changement de démo (six cartes)');
await pg.click('.sc-switch button[data-device="desktop"]'); assert.equal(await pg.getAttribute('#showcase', 'data-device'), 'desktop'); assert.equal(await pg.getAttribute('.sc-switch button[data-device="desktop"]', 'aria-pressed'), 'true'); ok('bascule mobile / ordinateur');
await pg.focus('.sc-tab[aria-selected="true"]'); await pg.keyboard.press('ArrowUp'); assert.equal(await pg.getAttribute('.sc-tab:nth-child(5)', 'aria-selected'), 'true'); ok('sélecteur de démos au clavier');
// rail
assert.equal(await pg.locator('#rail').isVisible(), true); await pg.evaluate(() => document.querySelector('#engagements').scrollIntoView()); await pg.waitForTimeout(600);
assert.equal(await pg.locator('#rail a[aria-current="location"]').getAttribute('href'), '#engagements'); ok('sommaire latéral suit la section');
// bouton rendez-vous : Cal.com
assert.equal(await pg.getAttribute('[data-booking-link]', 'href'), 'https://cal.com/studioglsc/premier-echange'); ok('rendez-vous : lien Cal.com du premier échange');
// film de présentation : choix de la durée et du format
await pg.evaluate(() => document.querySelector('#film').scrollIntoView());
assert.equal(await pg.locator('.film-opts').isVisible(), true);
assert.match(await pg.getAttribute('#film-video source', 'src'), /studioglsc-complet-h\.mp4$/);
await pg.click('.film-opts button[data-len="short"]'); await pg.click('.film-opts button[data-fmt="v"]');
assert.match(await pg.evaluate(() => document.querySelector('#film-video source').getAttribute('src')), /studioglsc-court-v\.mp4$/);
assert.equal(await pg.getAttribute('#film-box', 'data-fmt'), 'v'); assert.match(await pg.evaluate(() => document.querySelector('#film-video').getAttribute('poster')), /court-v\.webp$/);
for (const u of ['complet-h.mp4', 'court-v.mp4', 'court-v.webp']) { const r = await pg.evaluate((x) => fetch('/assets/video/studioglsc-' + x, { method: 'HEAD' }).then((q) => q.status + ' ' + q.headers.get('content-type')), u); assert.match(r, /^200 (video\/mp4|image\/webp)/, u + ' : ' + r); }
ok('film : durée et format changent la source, fichiers présents');
const off = (await pg.textContent('#offres')).replace(/\s/g, ' ');
assert.equal(await pg.locator('.price-card').count(), 3); assert.equal(await pg.locator('.plan').count(), 3); assert.equal(await pg.locator('.opts-grid li').count(), 4); assert.equal(await pg.locator('.pack').count(), 1); assert.equal(await pg.locator('.referral').count(), 1);
for (const t of [/590 €/, /790 €/, /au lieu de 890 €/, /dès 990 €/, /1 490 €/, /29 € \/ mois/, /59 € \/ mois/, /99 € \/ mois/, /290 € \/ an/, /50 € de remise/, /50 € de crédit/]) assert.match(off, t, String(t));
assert.doesNotMatch((await pg.textContent('body')).replace(/\s/g, ' '), /550 €|750 €|950 €|400 €|One-Page|non proposée|50 € \/ mois ou 500/); ok('offre : Pack Lancement 790 €, Express 590 €, Vitrine dès 990 €, Boutique dès 1 490 €, Sérénité 29/59/99 €, options, parrainage, aucune trace des anciens prix');
// les cartes Vitrine et Boutique ouvrent l'estimation avec la bonne formule
await pg.click('[data-pick="boutique"]'); assert.equal(await pg.locator('input[name="est-site"][value="boutique"]').isChecked(), true); await pg.check('input[name="est-site"][value="express"]', { force: true }); ok('carte Boutique : ouvre l’estimation sur la boutique');
// estimation -> formulaire
await pg.check('input[name="est-site"][value="pack"]', { force: true }); await pg.check('input[name="est-plan"][value="plus"]', { force: true });
await pg.evaluate(() => document.querySelector('#estimate').scrollIntoView()); await pg.click('#est-cta'); await pg.waitForTimeout(400);
assert.equal(await pg.locator('input[name=service][value="Pack Lancement"]').isChecked(), true); assert.match(await pg.inputValue('#form-message'), /Mon estimation : Pack Lancement 790 €.*Sérénité Plus/s); ok('« Demander ce devis » préremplit le besoin et le message');
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
