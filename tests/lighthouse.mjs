// Lighthouse (mobile) sur des pages types : échoue si un score passe sous le seuil. Nécessite Chromium (CHROME_PATH ou CHROMIUM_PATH).
//   npm run lighthouse
import { launch as launchChrome } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { serve, ok } from './helpers.mjs';
import assert from 'node:assert/strict';

const THRESHOLDS = { performance: 0.9, accessibility: 0.95, 'best-practices': 0.95, seo: 0.95 };
const PAGES = ['/', '/sites-pour/artisans-btp/', '/blog/cout-site-vitrine-artisan/', '/a-propos/'];
const { base, close } = await serve({ csp: true });
const chrome = await launchChrome({ chromePath: process.env.CHROME_PATH || process.env.CHROMIUM_PATH, chromeFlags: ['--headless=new', '--no-sandbox'] });
const low = [];
for (const path of PAGES) {
  const { lhr } = await lighthouse(base + path, { port: chrome.port, logLevel: 'error', output: 'json', onlyCategories: Object.keys(THRESHOLDS) });
  const line = Object.keys(THRESHOLDS).map((k) => `${k} ${Math.round(lhr.categories[k].score * 100)}`).join(' · ');
  console.log(`${path.padEnd(36)} ${line}`);
  for (const [k, min] of Object.entries(THRESHOLDS)) if (lhr.categories[k].score < min) {
    const bad = Object.values(lhr.audits).filter((a) => a.score !== null && a.score < 0.9 && lhr.categories[k].auditRefs.some((r) => r.id === a.id && r.weight > 0)).map((a) => a.id);
    low.push(`${path} : ${k} ${Math.round(lhr.categories[k].score * 100)} < ${min * 100} (${bad.slice(0, 4).join(', ')})`);
  }
}
await chrome.kill(); close();
assert.deepEqual(low, [], '\n' + low.join('\n'));
ok('Lighthouse : tous les scores atteignent le seuil');
