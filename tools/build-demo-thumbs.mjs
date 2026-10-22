// Vignettes 960×600 des démos (page d'accueil + galerie /demos/), prises dans Chromium puis converties en webp.
//   CHROMIUM_PATH=… node tools/build-demo-thumbs.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serve, launch, ROOT } from '../tests/helpers.mjs';

const SLUGS = ['restaurant', 'coiffeur', 'photographe', 'gite', 'club', 'btp'];
const tmp = mkdtempSync(join(tmpdir(), 'thumbs-'));
const { base, close } = await serve({ csp: false });
const b = await launch();
const pg = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
for (const s of SLUGS) {
  await pg.goto(`${base}/demos/${s}/`);
  await pg.addStyleTag({ content: '.dm-bar{display:none!important}' });
  await pg.waitForTimeout(700);
  await pg.screenshot({ path: join(tmp, `${s}.png`), clip: { x: 0, y: 0, width: 1440, height: 900 } });
  execFileSync('python3', ['-I', '-c', 'import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGB").resize((960,600),Image.LANCZOS);im.save(sys.argv[2],"WEBP",quality=80,method=6)', join(tmp, `${s}.png`), join(ROOT, `assets/img/demo-${s}.webp`)]);
  console.log('demo-' + s + '.webp');
}
await b.close(); close(); rmSync(tmp, { recursive: true, force: true });
