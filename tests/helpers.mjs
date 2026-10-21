// Outils communs aux tests : serveur statique qui applique les en-têtes de production (lus dans deploy/studio-security.conf) et lancement de Chromium.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };

// La politique CSP de production : première ligne « add_header Content-Security-Policy » du fichier nginx (celle du serveur).
export const CSP = /add_header Content-Security-Policy "([^"]+)"/.exec(readFileSync(join(ROOT, 'deploy/studio-security.conf'), 'utf8'))[1];

export function serve({ csp = true } = {}) {
  const server = createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = join(ROOT, url);
    if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    let status = 200;
    if (!existsSync(file)) { file = join(ROOT, '404.html'); status = 404; }
    res.statusCode = status;
    res.setHeader('content-type', TYPES[extname(file)] || 'application/octet-stream');
    if (csp && file.endsWith('.html') && !/-demo\.html$/.test(file)) res.setHeader('content-security-policy', CSP);
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })));
}

export const launch = () => chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
export const PAGES = ['/', '/a-propos/', '/blog/', '/blog/cout-site-vitrine-artisan/', '/sites-pour/artisans-btp/', '/creation-site-web/lorient/', '/mentions-legales.html', '/cgv.html', '/cgu.html', '/suivi/', '/introuvable-test'];
export const ok = (m) => console.log('✓', m);
