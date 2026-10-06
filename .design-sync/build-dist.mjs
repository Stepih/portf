#!/usr/bin/env node
// Builds src/components into a library-shaped package for design-sync:
//   .design-sync/.cache/dist/{index.mjs, index.css, index.d.ts, types/, package.json}
// The app itself is a Next.js site with no library build, so this is the
// "dist" the converter bundles. Real component code + real SCSS; only the
// Next.js runtime modules (next/link, next/image, next/navigation,
// next/font/local) are swapped for the plain-DOM stand-ins in ./shims.
//
// Usage (from repo root): node .design-sync/build-dist.mjs
// Needs esbuild from .ds-sync/node_modules (the converter's staged deps).

import { createRequire } from 'node:module';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = join(HERE, '.cache', 'dist');
const SHIMS = join(HERE, 'shims');

const requireRepo = createRequire(join(ROOT, 'package.json'));
const requireSync = createRequire(join(ROOT, '.ds-sync', 'package.json'));
const { build } = requireSync('esbuild');
const sass = requireRepo('sass');
const { transform: svgr } = requireRepo('@svgr/core');
const svgrSvgo = requireRepo('@svgr/plugin-svgo').default ?? requireRepo('@svgr/plugin-svgo');
const svgrJsx = requireRepo('@svgr/plugin-jsx').default ?? requireRepo('@svgr/plugin-jsx');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// `@use '/src/styles/variables.scss'` is root-relative in this repo (Next
// resolves it against the project root) - map leading-slash urls to ROOT.
const rootImporter = {
  findFileUrl(url) {
    if (!url.startsWith('/')) return null;
    return pathToFileURL(join(ROOT, url));
  },
};
const compileScss = (path) =>
  sass.compile(path, { importers: [rootImporter], loadPaths: [join(ROOT, 'src', 'styles')], silenceDeprecations: ['import', 'legacy-js-api'] }).css;

const nextShims = {
  name: 'next-shims',
  setup(b) {
    const map = {
      'next/link': join(SHIMS, 'next-link.tsx'),
      'next/image': join(SHIMS, 'next-image.tsx'),
      'next/navigation': join(SHIMS, 'next-navigation.ts'),
    };
    b.onResolve({ filter: /^next\/(link|image|navigation)$/ }, (a) => ({ path: map[a.path] }));
    // src/app/fonts/fonts.ts wraps next/font/local - swap the whole module.
    b.onResolve({ filter: /(^|\/)app\/fonts\/fonts$/ }, () => ({ path: join(SHIMS, 'fonts.ts') }));
  },
};

const scssPlugin = {
  name: 'scss',
  setup(b) {
    b.onLoad({ filter: /\.scss$/ }, (a) => ({
      contents: compileScss(a.path),
      loader: /\.module\.scss$/.test(a.path) ? 'local-css' : 'css',
      resolveDir: dirname(a.path),
    }));
  },
};

// Mirrors next.config.mjs: `*.svg` -> React component via @svgr/webpack.
const svgPlugin = {
  name: 'svgr',
  setup(b) {
    b.onLoad({ filter: /\.svg$/ }, async (a) => ({
      contents: await svgr(readFileSync(a.path, 'utf8'), { plugins: [svgrSvgo, svgrJsx], jsxRuntime: 'automatic' }, { filePath: a.path }),
      loader: 'jsx',
    }));
  },
};

const result = await build({
  entryPoints: { index: join(HERE, 'entry.ts') },
  outdir: OUT,
  outExtension: { '.js': '.mjs' },
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  tsconfig: join(ROOT, 'tsconfig.json'),
  plugins: [nextShims, scssPlugin, svgPlugin],
  // Real npm deps stay external - the converter bundles them from node_modules.
  external: ['react', 'react-dom', 'react/jsx-runtime', 'framer-motion', 'lodash', 'lodash/*'],
  loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.ttf': 'file', '.woff': 'file', '.woff2': 'file' },
  assetNames: 'fonts/[name]',
  logLevel: 'warning',
  logOverride: { 'unsupported-directive': 'silent' },
  metafile: true,
});
console.error(`dist: index.mjs ${(statSync(join(OUT, 'index.mjs')).size / 1024).toFixed(0)} KB, index.css ${(statSync(join(OUT, 'index.css')).size / 1024).toFixed(0)} KB`);

// -- .d.ts: tsc declaration emit over the exported component files --------
const entrySrc = readFileSync(join(HERE, 'entry.ts'), 'utf8');
const exportsList = [...entrySrc.matchAll(/^export \{ ([^}]+) \} from '@\/([^']+)';/gm)].map((m) => ({ spec: m[1].trim(), rel: m[2] }));
const tscCfg = join(HERE, '.cache', 'tsconfig.dts.json');
writeFileSync(tscCfg, JSON.stringify({
  extends: '../../tsconfig.json',
  compilerOptions: {
    noEmit: false, declaration: true, emitDeclarationOnly: true, incremental: false,
    outDir: './dist/types', rootDir: '../../src', plugins: [], noEmitOnError: false,
  },
  include: [],
  files: ['../../next-env.d.ts', ...exportsList.map((e) => `../../src/${e.rel}.tsx`)],
}, null, 2));
try {
  execFileSync(process.execPath, [requireRepo.resolve('typescript/bin/tsc'), '-p', tscCfg], { stdio: 'pipe' });
} catch (e) {
  // Type errors don't block emit (noEmitOnError: false); report them.
  const out = String(e.stdout ?? '') + String(e.stderr ?? '');
  console.error(`tsc reported ${(out.match(/error TS/g) ?? []).length} type error(s) (declarations still emitted)`);
}
// Rewrite `@/x` aliases in emitted .d.ts to relative paths (ts-morph reads
// dist without the repo's tsconfig paths).
const typesDir = join(OUT, 'types');
(function fix(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { fix(p); continue; }
    if (!p.endsWith('.d.ts')) continue;
    const src = readFileSync(p, 'utf8');
    const next = src.replace(/(['"])@\/([^'"]+)\1/g, (_, q, tail) => {
      let r = relative(dirname(p), join(typesDir, tail)).replace(/\\/g, '/');
      if (!r.startsWith('.')) r = './' + r;
      return q + r + q;
    });
    if (next !== src) writeFileSync(p, next);
  }
})(typesDir);
writeFileSync(join(OUT, 'index.d.ts'), exportsList.map((e) => `export { ${e.spec} } from './types/${e.rel}';`).join('\n') + '\n');

writeFileSync(join(OUT, 'package.json'), JSON.stringify({
  name: 'portfolio-ui',
  version: JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version,
  private: true,
  type: 'module',
  module: 'index.mjs',
  types: 'index.d.ts',
  peerDependencies: { react: '*', 'react-dom': '*', 'framer-motion': '*' },
}, null, 2));
console.error(`dist: ${exportsList.length} export lines -> ${relative(ROOT, OUT)}`);
