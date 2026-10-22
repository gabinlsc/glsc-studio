// Budget de poids : échoue si un fichier ou une page dépasse la limite fixée (évite que le site s'alourdit sans que personne ne s'en aperçoive).
//   node tools/check-budget.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KB = 1024;
const LIMITS = { // [octets bruts, octets gzip]
  'assets/studio.css': [60 * KB, 14 * KB], 'assets/studio.js': [12 * KB, 5 * KB], 'assets/home.js': [24 * KB, 8 * KB],
  'assets/legal.js': [4 * KB, 2 * KB], 'assets/notfound.js': [5 * KB, 2 * KB], 'legal.css': [16 * KB, 5 * KB],
};
const IMAGE_MAX = 70 * KB, FONT_MAX = 30 * KB, HTML_MAX = [80 * KB, 20 * KB];
const PAGE_BUDGET_GZ = 55 * KB; // HTML + CSS + JS d'une page (hors images et polices), compressés

let errors = 0;
const fail = (m) => { errors++; console.error('✗ ' + m); };
const gz = (file) => gzipSync(readFileSync(file), { level: 9 }).length;
const fmt = (n) => (n / KB).toFixed(1) + ' Ko';

for (const [rel, [raw, zipped]] of Object.entries(LIMITS)) {
  const f = join(ROOT, rel), size = statSync(f).size, z = gz(f);
  if (size > raw) fail(`${rel} : ${fmt(size)} (limite ${fmt(raw)})`);
  if (z > zipped) fail(`${rel} : ${fmt(z)} compressé (limite ${fmt(zipped)})`);
}
for (const dir of ['assets/img', 'assets/fonts']) for (const f of readdirSync(join(ROOT, dir))) {
  const size = statSync(join(ROOT, dir, f)).size, max = dir.endsWith('fonts') ? FONT_MAX : IMAGE_MAX;
  if (size > max) fail(`${dir}/${f} : ${fmt(size)} (limite ${fmt(max)})`);
}
const pages = [];
(function walk(d) { for (const f of readdirSync(d)) { if (['node_modules', '.git', 'tools', 'branding', 'docs', 'tests'].includes(f)) continue; const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html') && !/-demo\.html$/.test(f)) pages.push(p); } })(ROOT);
const shared = ['assets/studio.css', 'assets/studio.js'].reduce((a, f) => a + gz(join(ROOT, f)), 0);
let heaviest = ['', 0];
for (const p of pages) {
  const html = readFileSync(p, 'utf8'), size = Buffer.byteLength(html), z = gz(p);
  if (size > HTML_MAX[0] || z > HTML_MAX[1]) fail(`${relative(ROOT, p)} : HTML ${fmt(size)} / ${fmt(z)} compressé (limite ${fmt(HTML_MAX[0])} / ${fmt(HTML_MAX[1])})`);
  const extra = (/assets\/home\.js/.test(html) ? gz(join(ROOT, 'assets/home.js')) : 0) + (/href="\/legal\.css"/.test(html) ? gz(join(ROOT, 'legal.css')) : 0);
  const total = z + shared + extra;
  if (total > PAGE_BUDGET_GZ) fail(`${relative(ROOT, p)} : ${fmt(total)} compressé pour HTML + CSS + JS (limite ${fmt(PAGE_BUDGET_GZ)})`);
  if (total > heaviest[1]) heaviest = [relative(ROOT, p), total];
}
console.log(`${pages.length} pages · la plus lourde : ${heaviest[0]} (${fmt(heaviest[1])} compressé, budget ${fmt(PAGE_BUDGET_GZ)}) · ${errors} dépassement(s)`);
process.exit(errors ? 1 : 0);
