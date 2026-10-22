// Rendu du film : une capture par image, assemblées par ffmpeg (H.264).
//   CHROMIUM_PATH=… node promo/render.mjs out.mp4 [--audio promo/audio/bande-son.wav] [--from 0] [--to 47] [--fps 30]
//   CHROMIUM_PATH=… node promo/render.mjs --frames 1,5,9.5 dossier/    (images fixes de contrôle)
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { serve, launch } from '../tests/helpers.mjs';
const settle = (pg) => pg.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
const { base, close } = await serve({ csp: false });
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const pg = await ctx.newPage();
pg.on('pageerror', (e) => console.error('ERREUR PAGE', e.message));
await pg.goto(base + '/promo/index.html'); await pg.waitForFunction(() => window.READY === true, null, { timeout: 30000 });

if (args[0] === '--frames') {
  const dir = args[2]; mkdirSync(dir, { recursive: true });
  for (const t of args[1].split(',').map(Number)) { await pg.evaluate((x) => window.render(x), t); await settle(pg); await settle(pg); await pg.screenshot({ path: join(dir, `t${String(t).replace('.', '_')}.png`) }); console.log('t =', t); }
} else {
  const out = args[0], fps = +opt('fps', 30), total = await pg.evaluate(() => window.TOTAL), from = +opt('from', 0), to = +opt('to', total), audio = opt('audio', '');
  const ff = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-'];
  if (audio) ff.push('-i', audio);
  ff.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  if (audio) ff.push('-c:a', 'aac', '-b:a', '256k', '-shortest');
  ff.push(out);
  const p = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((to - from) * fps); const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await pg.evaluate((x) => window.render(x), from + i / fps); await settle(pg);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 96 });
    if (!p.stdin.write(buf)) await new Promise((r) => p.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`image ${i}/${n} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  p.stdin.end(); await new Promise((r) => p.on('close', r)); console.log('terminé', out);
}
await b.close(); close();
