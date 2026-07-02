import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

// ─── Config ───────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 3000;
const BASE_URL =
  process.env.BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`);
const PUBLIC_DIR = process.env.PUBLIC_DIR
  ? resolve(process.env.PUBLIC_DIR)
  : null;

// ─── In-memory store ──────────────────────────────────────────────────────────

const links = new Map(); // code → { code, url, hits, createdAt }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const B62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => B62[b % 62]).join("");
}

function shape(entry) {
  return {
    code: entry.code,
    url: entry.url,
    shortUrl: `${BASE_URL}/${entry.code}`,
    hits: entry.hits,
    createdAt: entry.createdAt,
  };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ─── Static file serving ──────────────────────────────────────────────────────

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function serveStatic(pathname) {
  if (!PUBLIC_DIR) return null;

  // Strip leading slashes then resolve strictly inside PUBLIC_DIR
  const rel = (pathname === "/" ? "index.html" : pathname).replace(/^\/+/, "");
  const filePath = resolve(PUBLIC_DIR, rel);

  // Guard against path-traversal attacks
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + sep)) {
    return null;
  }

  try {
    let target = filePath;
    const s = await stat(target);
    if (s.isDirectory()) {
      target = resolve(target, "index.html");
      if (!target.startsWith(PUBLIC_DIR + sep)) return null;
    }
    const body = await readFile(target);
    const mime = MIME[extname(target).toLowerCase()] ?? "application/octet-stream";
    return new Response(body, { headers: { ...CORS, "Content-Type": mime } });
  } catch {
    return null;
  }
}

// ─── Server ───────────────────────────────────────────────────────────────────

const server = Bun.serve({
  port: PORT,

  async fetch(req) {
    const { pathname } = new URL(req.url);
    const method = req.method;

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // POST /api/links  →  create short link
    if (method === "POST" && pathname === "/api/links") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      if (typeof body?.url !== "string") {
        return json({ error: "url must be a string" }, 400);
      }

      let parsed;
      try {
        parsed = new URL(body.url);
      } catch {
        return json({ error: "url is not a valid URL" }, 400);
      }

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return json({ error: "url must use http or https" }, 400);
      }

      let code;
      do {
        code = generateCode();
      } while (links.has(code));

      const entry = {
        code,
        url: body.url,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, entry);
      return json(shape(entry), 201);
    }

    // GET /api/links  →  list all links
    if (method === "GET" && pathname === "/api/links") {
      return json([...links.values()].map(shape));
    }

    // GET *  →  static file first (wins over same-named short code), then redirect
    if (method === "GET") {
      const staticRes = await serveStatic(pathname);
      if (staticRes) return staticRes;

      if (pathname.length > 1) {
        const code = pathname.slice(1);
        const entry = links.get(code);
        if (entry) {
          entry.hits++;
          return new Response(null, {
            status: 302,
            headers: { ...CORS, Location: entry.url },
          });
        }
      }
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`Snip backend  →  http://localhost:${server.port}`);
console.log(`BASE_URL      →  ${BASE_URL}`);
if (PUBLIC_DIR) console.log(`Static dir    →  ${PUBLIC_DIR}`);
