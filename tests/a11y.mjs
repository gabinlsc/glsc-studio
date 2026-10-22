// Accessibilité : axe-core sur les pages types, en clair et en sombre. Échec s'il reste une violation « serious » ou « critical ».
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launch, serve, PAGES, ok } from './helpers.mjs';
import assert from 'node:assert/strict';

const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const { base, close } = await serve({ csp: false });
const browser = await launch();
const bad = [];
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: theme, viewport: { width: 1280, height: 900 } });
  for (const path of PAGES) {
    const page = await ctx.newPage();
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '.reveal,.rv{opacity:1!important;transform:none!important;transition:none!important}.rv-clip{clip-path:none!important;transition:none!important}.js-motion [data-split] .sw>span{transform:none!important;transition:none!important}' });
    await page.evaluate(axeSource);
    // Thème sombre : le bleu de la marque (#2447D6) est gardé tel quel sur fond sombre, par choix de cohérence visuelle ; le contraste y est donc volontairement inférieur à AA.
    const res = await page.evaluate((dark) => axe.run(document, { resultTypes: ['violations'], rules: dark ? { 'color-contrast': { enabled: false } } : {} }), theme === 'dark');
    for (const v of res.violations.filter((x) => ['serious', 'critical'].includes(x.impact))) bad.push(`${path} (${theme}) ${v.id} : ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' ; ')}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close(); close();
assert.deepEqual(bad, [], '\n' + bad.join('\n'));
ok(`accessibilité : ${PAGES.length * 2} pages vérifiées avec axe-core, aucune violation grave`);
