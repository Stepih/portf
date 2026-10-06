#!/usr/bin/env node
// Re-shoots authored preview cells after framer-motion entry animations
// settle. package-capture screenshots ~immediately under a fixed clock, so
// components whose visible state comes from an initial->animate transition
// (Prompt, LoadingBlock, ErrorMessage, BgFocus...) capture mid-fade. Same
// card html, same server, same 900x700 viewport - only a longer wait, and finite CSS/WAAPI
// animations fast-forwarded to their end state (framer-motion runs opacity
// fades on WAAPI, which the frozen clock otherwise leaves mid-flight).
// Usage: node .design-sync/settled-shots.mjs <Name>[,<Name>...] [waitMs]
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const require = createRequire(join(process.cwd(), '.ds-sync', 'package.json'));
const { chromium } = require('playwright');
const { serveDir } = await import(new URL('../.ds-sync/storybook/http-serve.mjs', import.meta.url));
const OUT = './ds-bundle';
const names = (process.argv[2] ?? '').split(',').filter(Boolean);
const wait = +(process.argv[3] ?? 1500);
const manifest = JSON.parse(readFileSync(join(OUT, '.stories-map.json'), 'utf8'));
const dir = join(OUT, '_screenshots', 'review', 'settled');
mkdirSync(dir, { recursive: true });
const { srv, port } = await serveDir(OUT);
const b = await chromium.launch(process.env.DS_CHROMIUM_PATH ? { executablePath: process.env.DS_CHROMIUM_PATH } : {});
const p = await b.newPage({ viewport: { width: 900, height: 700 } });
// Real clock on purpose: under page.clock.setFixedTime (package-capture's
// setting) WAAPI-driven fades never paint their end state in screenshots.
for (const n of names) {
  const c = manifest.components.find((x) => x.name === n);
  if (!c) { console.error(`? ${n} not in manifest`); continue; }
  const rel = `components/${c.group}/${c.name}/${c.name}.html`;
  const head = readFileSync(join(OUT, rel), 'utf8').split('\n', 1)[0];
  const vp = /viewport="(\d+)x(\d+)"/.exec(head);
  await p.setViewportSize(vp ? { width: +vp[1], height: +vp[2] } : { width: 900, height: 700 });
  await p.goto(`http://127.0.0.1:${port}/${rel}`, { waitUntil: 'networkidle' });
  const cells = await p.evaluate(() => window.__dsCells ?? []);
  for (const cell of cells) {
    await p.goto(`http://127.0.0.1:${port}/${rel}?story=${cell}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(wait);
    const f = join(dir, `${c.name}__${cell}.png`);
    await p.screenshot({ path: f, animations: 'disabled' });
    console.error(`  ${f}`);
  }
}
await b.close(); srv.close();
