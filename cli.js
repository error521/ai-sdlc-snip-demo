#!/usr/bin/env node
'use strict';

// cli.js – Snip URL-shortener CLI
// Requires Node >= 18 (global fetch).  CommonJS, zero npm dependencies.

const { spawn }    = require('child_process');
const { platform } = require('os');
const http         = require('http');
const https        = require('https');

const BASE = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/+$/, '');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function die(msg) {
  process.stderr.write(msg + '\n');
  process.exit(1);
}

/** Fetch wrapper – exits on network error. */
async function apiFetch(path, init) {
  try {
    return await fetch(BASE + path, init);
  } catch (err) {
    die(`Cannot reach backend at ${BASE}: ${err.message}`);
  }
}

/**
 * GET without following redirects.
 * Uses the built-in http/https module because the WHATWG fetch spec makes
 * redirect:'manual' responses opaque (status 0, headers stripped); the http
 * module returns the actual 301/302 status and Location header.
 */
function rawGet(url) {
  return new Promise((resolve, reject) => {
    (url.startsWith('https') ? https : http)
      .get(url, res => { res.resume(); resolve(res); })  // resume() drains body / frees socket
      .on('error', reject);
  });
}

/** Open a URL in the OS default browser without shell-escaping issues. */
function openBrowser(url) {
  let child;
  const sys = platform();
  if (sys === 'win32') {
    // cmd /c start avoids PowerShell's quoting quirks; pass url as its own arg
    child = spawn('cmd.exe', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' });
  } else if (sys === 'darwin') {
    child = spawn('open', [url], { detached: true, stdio: 'ignore' });
  } else {
    child = spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
  }
  child.unref();
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function cmdAdd(url) {
  if (!url) die('Usage: snip add <url>');

  // Client-side validation before hitting the network
  let parsed;
  try { parsed = new URL(url); } catch { die(`Invalid URL: ${url}`); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    die('URL must use http or https.');
  }

  const res = await apiFetch('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    let msg;
    try { msg = (await res.json()).error; } catch { msg = res.statusText; }
    die(`Error ${res.status}: ${msg}`);
  }

  const link = await res.json();
  console.log(link.shortUrl);
}

async function cmdLs() {
  const res = await apiFetch('/api/links');
  if (!res.ok) die(`Error ${res.status}: ${res.statusText}`);

  const links = await res.json();
  if (!links.length) { console.log('No links yet.'); return; }

  // Dynamic column widths
  const codeW = Math.max(4, ...links.map(l => l.code.length));
  const hitsW = Math.max(4, ...links.map(l => String(l.hits).length));
  const urlW  = Math.max(3, ...links.map(l => l.url.length));

  const row = (c, h, u) => c.padEnd(codeW) + '  ' + String(h).padStart(hitsW) + '  ' + u;
  const sep  = '-'.repeat(codeW) + '  ' + '-'.repeat(hitsW) + '  ' + '-'.repeat(urlW);

  console.log(row('CODE', 'HITS', 'URL'));
  console.log(sep);
  for (const l of links) console.log(row(l.code, l.hits, l.url));
}

async function cmdOpen(code) {
  if (!code) die('Usage: snip open <code>');

  let res;
  try {
    res = await rawGet(`${BASE}/${code}`);
  } catch (err) {
    die(`Cannot reach backend at ${BASE}: ${err.message}`);
  }

  if (res.statusCode === 404) die(`Unknown code: ${code}`);
  if (res.statusCode !== 301 && res.statusCode !== 302) {
    die(`Unexpected response ${res.statusCode} for code "${code}"`);
  }

  const location = res.headers['location'];
  if (!location) die('Backend redirect had no Location header.');

  openBrowser(location);
  console.log(location);
}

function usage() {
  console.log(`Snip CLI – URL shortener client

Usage:
  snip add <url>    Shorten a URL and print the short link
  snip ls           List all short links
  snip open <code>  Open a short link in the OS browser

Environment:
  SNIP_API    Backend base URL  (default: http://localhost:3000)`);
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

const [,, cmd, arg] = process.argv;

(async () => {
  switch (cmd) {
    case 'add':  await cmdAdd(arg);  break;
    case 'ls':   await cmdLs();      break;
    case 'open': await cmdOpen(arg); break;
    default:     usage();            break;
  }
})().catch(err => die(err.message));
