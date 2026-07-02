#!/usr/bin/env node
// scripts/build-bundle.mjs
// Assembles the "bundle" submodule from backend + frontend + cli source submodules.
//
//   node scripts/build-bundle.mjs          # build + commit (no push)
//   node scripts/build-bundle.mjs --push   # build + commit + push

import { execSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT  = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUSH  = process.argv.includes('--push');
const isWin = process.platform === 'win32';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Run a shell command; exit the process on non-zero status. */
function run(cmd, cwd = ROOT) {
  console.log(`  $ ${cmd}`);
  const r = spawnSync(cmd, { shell: true, cwd, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\nFATAL: command exited ${r.status}: ${cmd}`);
    process.exit(r.status ?? 1);
  }
}

/** Run a shell command and return stdout (empty string on error). */
function capture(cmd, cwd = ROOT) {
  try {
    return execSync(cmd, { shell: true, cwd, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

/** True when the index differs from HEAD (i.e. there is something to commit). */
function hasStagedChanges(dir) {
  return capture('git diff --cached --stat', dir) !== '';
}

// ── Step 1: Update source submodules to their branch tips ────────────────────

console.log('\n▶ Updating source submodules …');
run('git submodule update --init --remote backend frontend cli');

// ── Step 2: Build the Angular front-end ─────────────────────────────────────

const frontendDir = join(ROOT, 'frontend');

console.log('\n▶ Installing frontend dependencies …');
run('npm install', frontendDir);

console.log('\n▶ Building Angular app (production) …');
// Use the locally-installed ng binary (cross-platform: .cmd on Windows, plain on POSIX)
const ngBin = join(frontendDir, 'node_modules', '.bin', isWin ? 'ng.cmd' : 'ng');
run(`"${ngBin}" build --configuration production`, frontendDir);

const indexHtml = join(frontendDir, 'dist', 'snip-frontend', 'browser', 'index.html');
if (!existsSync(indexHtml)) {
  console.error(`\nFATAL: expected build output not found: ${indexHtml}`);
  process.exit(1);
}
console.log('  ✓ build output verified');

// ── Step 3: Assemble bundle/ ─────────────────────────────────────────────────

const bundleDir = join(ROOT, 'bundle');
const publicDir  = join(bundleDir, 'public');

console.log('\n▶ Assembling bundle/ …');

// Refresh public/ while preserving the .git directory
if (existsSync(publicDir)) rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });

// Server and CLI entry points (copied verbatim)
cpSync(join(ROOT, 'backend', 'server.js'), join(bundleDir, 'server.js'));
cpSync(join(ROOT, 'cli', 'cli.js'),        join(bundleDir, 'cli.js'));

// Angular production build → public/
cpSync(
  join(frontendDir, 'dist', 'snip-frontend', 'browser'),
  publicDir,
  { recursive: true }
);

// .env — tells the Bun server to also serve the compiled UI
writeFileSync(join(bundleDir, '.env'), 'PUBLIC_DIR=./public\n');

// package.json — "start" script for `bun run start`; NO "type" field so that
// cli.js continues to work under plain node (it uses require/CJS patterns).
writeFileSync(
  join(bundleDir, 'package.json'),
  JSON.stringify(
    { name: 'snip-bundle', version: '1.0.0', scripts: { start: 'bun server.js' } },
    null,
    2
  ) + '\n'
);

// Dockerfile — minimal Bun image
writeFileSync(join(bundleDir, 'Dockerfile'), [
  'FROM oven/bun:1-alpine',
  'COPY . .',
  'ENV PORT=3000',
  'EXPOSE 3000',
  'CMD bun server.js',
  '',
].join('\n'));

// .dockerignore — exclude source-control noise from the image
writeFileSync(join(bundleDir, '.dockerignore'), [
  '.git',
  '*.md',
  '',
].join('\n'));

// railway.json — tell Railway to use the Dockerfile builder
writeFileSync(
  join(bundleDir, 'railway.json'),
  JSON.stringify(
    {
      $schema: 'https://railway.app/railway.schema.json',
      build: { builder: 'DOCKERFILE', dockerfilePath: 'Dockerfile' },
    },
    null,
    2
  ) + '\n'
);

console.log('  ✓ bundle/ assembled');

// ── Step 4: Commit inside the bundle submodule ───────────────────────────────

console.log('\n▶ Committing bundle/ …');
run('git add -A', bundleDir);

if (hasStagedChanges(bundleDir)) {
  run('git commit -m "chore: update bundle output"', bundleDir);
} else {
  console.log('  (nothing changed in bundle/ — skipping commit)');
}

// Submodule checkouts are often detached; HEAD:bundle targets the remote branch.
// Always push when --push is given; git push is a no-op if already up-to-date.
if (PUSH) {
  console.log('  Pushing bundle branch …');
  run('git push origin HEAD:bundle', bundleDir);
}

// ── Step 5: Bump the bundle submodule pointer in the superproject ────────────

console.log('\n▶ Bumping superproject submodule pointer …');
run('git add bundle', ROOT);

if (hasStagedChanges(ROOT)) {
  run('git commit -m "chore: update bundle submodule pointer"', ROOT);
} else {
  console.log('  (bundle pointer unchanged — skipping commit)');
}

if (PUSH) {
  console.log('  Pushing main …');
  run('git push origin main', ROOT);
}

console.log('\n✓ Done.');
