// Charge chaque page avec la politique CSP de production : aucune violation ne doit être signalée.
import { launch, serve, PAGES, ok } from './helpers.mjs';
import assert from 'node:assert/strict';

const { base, close } = await serve({ csp: true });
const browser = await launch();
let total = 0;
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: theme });
  for (const path of PAGES) {
    const page = await ctx.newPage();
    const issues = [];
    page.on('console', (m) => { if (m.type() === 'error' && /CSP |Refused|Content Security Policy/.test(m.text())) issues.push(m.text()); }); // les échecs réseau vers des CDN (démos) n'en sont pas
    page.on('pageerror', (e) => issues.push(e.message));
    await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) => console.error('CSP ' + e.violatedDirective + ' ' + e.blockedURI)));
    await page.goto(base + path, { waitUntil: 'networkidle' });
    if (path === '/') { // les parties interactives ne doivent pas non plus être bloquées
      await page.click('#theme-toggle'); await page.click('#demo-launch'); await page.fill('#estimate input[value="month"]', '', { force: true }).catch(() => {});
      await page.waitForTimeout(400);
    }
    assert.deepEqual(issues, [], `${path} (${theme}) : ${issues.join(' | ')}`);
    await page.close(); total++;
  }
  await ctx.close();
}
ok(`CSP de production : ${total} chargements sans violation`);
await browser.close(); close();
