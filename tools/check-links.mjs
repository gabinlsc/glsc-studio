// Vérifie les liens internes, les ancres et les icônes du sprite de toutes les pages HTML. Code de sortie 1 s'il y a une erreur.
//   node tools/check-links.mjs
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://studio.glsc.fr';
const SKIP = new Set(['node_modules', '.git', 'tools', 'branding']);
const pages = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    if (SKIP.has(f)) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) pages.push(p);
  }
})(ROOT);

const cache = new Map();
const html = (file) => { if (!cache.has(file)) cache.set(file, readFileSync(file, 'utf8')); return cache.get(file); };
const urlToFile = (path) => {
  const clean = decodeURIComponent(path.replace(/[?#].*$/, ''));
  for (const c of [clean, clean + '.html', join(clean, 'index.html')]) { const f = join(ROOT, c); if (existsSync(f) && statSync(f).isFile()) return f; }
  return null;
};
let errors = 0, checked = 0;
const fail = (page, msg) => { errors++; console.error(`✗ ${relative(ROOT, page)} : ${msg}`); };

for (const page of pages) {
  const src = html(page);
  const own = '/' + relative(ROOT, page).replace(/index\.html$/, '');
  const ids = new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of src.matchAll(/<(?:a|link|script|img|iframe|source)\b[^>]*?\s(?:href|src)="([^"]*)"/g)) {
    let u = m[1];
    if (!u || /^(mailto:|tel:|data:|javascript:|https?:\/\/(?!studio\.glsc\.fr))/.test(u)) continue;
    checked++;
    u = u.replace(ORIGIN, '');
    if (u.startsWith('#')) { if (u.length > 1 && !ids.has(u.slice(1))) fail(page, `ancre introuvable ${u}`); continue; }
    const path = u.startsWith('/') ? u : join(own.endsWith('/') ? own : dirname(own), u);
    const file = urlToFile(path);
    if (!file && path === "/assets/img/gabin.jpg") continue; // photo déposée sur le serveur par activate.sh
    if (!file) { fail(page, `lien cassé ${u}`); continue; }
    const hash = (u.match(/#(.+)$/) || [])[1];
    if (hash && file.endsWith('.html') && !new RegExp(`\\sid="${hash}"`).test(html(file))) fail(page, `ancre ${u} absente de ${relative(ROOT, file)}`);
  }
  // icônes du sprite
  const symbols = new Set([...src.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
  for (const m of src.matchAll(/<use href="#([^"]+)"/g)) {
    if (!symbols.size) fail(page, `<use #${m[1]}> sans sprite dans la page`);
    else if (!symbols.has(m[1])) fail(page, `icône inconnue #${m[1]}`);
  }
}
console.log(`${pages.length} pages, ${checked} liens vérifiés, ${errors} erreur(s)`);
process.exit(errors ? 1 : 0);
