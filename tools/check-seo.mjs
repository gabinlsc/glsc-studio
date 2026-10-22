// Contrôles de référencement de base sur toutes les pages indexables : titre, description, canonique, un seul h1, JSON-LD valide, images avec alt, identifiants uniques.
//   node tools/check-seo.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', 'tools', 'branding', 'docs', 'tests']);
const pages = [];
(function walk(dir) { for (const f of readdirSync(dir)) { if (SKIP.has(f)) continue; const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) pages.push(p); } })(ROOT);

let errors = 0, count = 0;
const titles = new Map(), descs = new Map();
const fail = (page, msg) => { errors++; console.error(`✗ ${relative(ROOT, page)} : ${msg}`); };
for (const page of pages) {
  const src = readFileSync(page, 'utf8');
  const rel = '/' + relative(ROOT, page).replace(/index\.html$/, '');
  if (/<meta name="robots" content="noindex/.test(src)) continue; // démos et 404 : volontairement hors index
  count++;
  const title = (/<title>([^<]*)<\/title>/.exec(src) || [])[1];
  const desc = (/<meta name="description" content="([^"]*)"/.exec(src) || [])[1];
  const canon = (/<link rel="canonical" href="([^"]*)"/.exec(src) || [])[1];
  if (!title) fail(page, 'balise <title> absente'); else {
    if (title.length > 70) fail(page, `titre trop long (${title.length} caractères, 70 max) : ${title}`);
    if (titles.has(title)) fail(page, `titre déjà utilisé par ${titles.get(title)}`); else titles.set(title, relative(ROOT, page));
  }
  if (!desc) fail(page, 'meta description absente'); else {
    if (desc.length < 70 || desc.length > 175) fail(page, `description de ${desc.length} caractères (70 à 175 attendus)`);
    if (descs.has(desc)) fail(page, `description déjà utilisée par ${descs.get(desc)}`); else descs.set(desc, relative(ROOT, page));
  }
  const expected = 'https://studio.glsc.fr' + rel;
  if (canon !== expected) fail(page, `canonique « ${canon} », attendue « ${expected} »`);
  const h1 = (src.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) fail(page, `${h1} balises <h1> (une seule attendue)`);
  if (!/<html lang="fr"/.test(src)) fail(page, 'attribut lang="fr" absent');
  if (!/property="og:image"/.test(src)) fail(page, 'og:image absente');
  for (const m of src.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) fail(page, `image sans alt : ${m[0].slice(0, 60)}`);
  for (const m of src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { fail(page, `JSON-LD invalide : ${e.message}`); } }
  const ids = [...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) fail(page, `identifiants en double : ${[...new Set(dup)].join(', ')}`);
}
console.log(`${count} pages indexables contrôlées, ${errors} erreur(s)`);
process.exit(errors ? 1 : 0);
