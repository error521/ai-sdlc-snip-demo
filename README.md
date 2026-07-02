# Snip

A tiny URL shortener built as three independent layers — one Bun backend and two
clients (a browser SPA and a terminal CLI) — each living on its own branch and
mounted here as a Git submodule.

```
browser ──► Angular SPA  (frontend/)  ──┐
                                         │  HTTP  ──► in-memory Map
CLI tool    (cli/)       ───────────────►│  :3000
                                         └── Bun server (backend/)
```

---

## API contract

Every response includes open CORS headers so the browser client can call the
backend from any origin.

| Method | Path | Request body | Success | Error |
|--------|------|-------------|---------|-------|
| `POST` | `/api/links` | `{ "url": "https://…" }` | **201** `{ code, url, shortUrl, hits, createdAt }` | **400** `{ error }` on invalid JSON or non-http(s) URL |
| `GET` | `/api/links` | — | **200** `Link[]` | — |
| `GET` | `/:code` | — | **302** → original URL (increments `hits`) | **404** if unknown |

### Link shape

```jsonc
{
  "code":     "aB3xY9",           // 6 random base-62 chars
  "url":      "https://…",        // original long URL
  "shortUrl": "http://…/aB3xY9", // BASE_URL + "/" + code
  "hits":     0,                  // incremented on every redirect
  "createdAt":"2024-01-01T00:00:00.000Z"
}
```

---

## Repository layout

```
(this repo, main branch)          ← superproject — only .gitmodules + README
├── backend/   → branch: backend  Bun HTTP server · server.js · zero npm deps
├── frontend/  → branch: frontend Angular 19 SPA  · src/app/  · signals
└── cli/       → branch: cli      Node CLI        · cli.js    · zero npm deps
```

Each branch has its own `README.md` with full details on that layer.

The `main` branch contains **only** `.gitmodules` and this file; all code lives
in the submodule branches so the layers stay completely independent and can be
cloned, built, and deployed on their own.

---

## Clone

> **Plain `git clone` leaves submodule folders empty.**  Always add
> `--recurse-submodules`:

```sh
git clone --recurse-submodules https://github.com/error521/ai-sdlc-snip-demo.git
cd ai-sdlc-snip-demo
```

Already cloned without the flag?

```sh
git submodule update --init --recursive
```

---

## Run

### 1 · Backend (requires [Bun](https://bun.sh) ≥ 1.0)

```sh
cd backend
bun run start
# Listening on :3000  (set PORT= to override)
```

Optional env vars:

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT` | `3000` | TCP port |
| `BASE_URL` | `http://localhost:<PORT>` | Origin used in `shortUrl` |
| `RAILWAY_PUBLIC_DOMAIN` | — | Falls back to `https://<domain>` when `BASE_URL` unset |
| `PUBLIC_DIR` | — | Serve static files (frontend `dist/`) from this path |

### 2 · Frontend (requires Node ≥ 18)

```sh
cd frontend
npm install
npx ng serve           # dev server → http://localhost:4200
                       # calls backend at http://localhost:3000
```

Production build (output lands in `dist/snip-frontend/browser/`):

```sh
npx ng build
```

Point the backend at the build folder to serve both from one port:

```sh
PUBLIC_DIR=../frontend/dist/snip-frontend/browser bun run start
```

### 3 · CLI (requires Node ≥ 18)

```sh
# No install required — use directly
node cli/cli.js add https://example.com/a/very/long/path
node cli/cli.js ls
node cli/cli.js open <code>

# Or install globally so 'snip' is on PATH
cd cli && npm install -g .
snip ls
```

Set `SNIP_API` to point at a remote backend:

```sh
SNIP_API=https://your-backend.railway.app snip ls
```

---

## Update workflow

Work inside the submodule, push its own branch, then bump the commit pointer
in this superproject:

```sh
# 1 ── Make and push changes inside a submodule
cd backend
#     … edit server.js …
git add .
git commit -m "fix: better error messages"
git push origin backend

# 2 ── Back in the superproject: advance the pointer to the new commit
cd ..
git submodule update --remote backend
git add backend
git commit -m "chore: bump backend pointer"
git push
```

To pull the latest tip of every tracked branch at once:

```sh
git submodule update --remote --merge
git add backend frontend cli
git commit -m "chore: bump all submodule pointers"
git push
```
