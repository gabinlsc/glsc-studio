import assert from 'node:assert/strict';
import { serve, launch, ok } from './helpers.mjs';

const { base, close } = await serve();
const b = await launch();
const pg = await b.newPage();
const errs = [];
pg.on('pageerror', (e) => errs.push(e.message));
const TOKEN = 'a'.repeat(32);
const project = { title: 'Site Boulangerie', client: 'Léa', status: 'build', steps: [{ label: 'Cadrage', state: 'done' }, { label: 'Maquette', state: 'current' }, { label: 'Mise en ligne', state: 'todo' }], messages: [{ from: 'studio', text: '<img src=x onerror=alert(1)> Bonjour', at: 1700000000 }], files: [] };
let calls = [];
await pg.route('**/api/project**', (r) => { calls.push({ url: r.request().url(), tok: (r.request().postDataJSON() || {}).token }); r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ project }) }); });

await pg.goto(base + '/suivi/');
assert.equal(await pg.locator('meta[name=robots]').getAttribute('content'), 'noindex,nofollow'); ok('suivi : noindex');
await pg.waitForTimeout(300);
assert.equal(calls.length, 0); assert.equal(await pg.locator('#state-error').isVisible(), true); ok('suivi : sans jeton, aucune requête et message d’erreur');

await pg.goto(base + '/suivi/#' + TOKEN); await pg.reload(); await pg.waitForTimeout(500);
assert.ok(calls.length >= 1); assert.equal(calls[0].tok, TOKEN); assert.ok(!calls[0].url.includes(TOKEN)); ok('suivi : jeton envoyé dans le corps de la requête, jamais dans l’URL');
assert.match(await pg.textContent('body'), /Site Boulangerie/);
assert.equal(await pg.locator('.bubble img').count(), 0); ok('suivi : messages affichés en texte brut (pas de HTML injecté)');

await pg.goto(base + '/suivi/#zzz'); await pg.reload(); await pg.waitForTimeout(300);
assert.equal(await pg.locator('#state-error').isVisible(), true); ok('suivi : jeton mal formé refusé côté client');
assert.deepEqual(errs, []); ok('suivi : aucune erreur JS');
await b.close(); close();
