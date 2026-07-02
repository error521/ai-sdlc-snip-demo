# Snip – backend

A minimal URL shortener API built with [Bun](https://bun.sh).
Zero npm dependencies. In-memory storage (resets on restart).

## Quick start

```sh
bun run start
```

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/links` | Create a short link |
| `GET` | `/api/links` | List all links |
| `GET` | `/:code` | Redirect to original URL (302), incrementing hits |

### POST /api/links

**Request body**
```json
{ "url": "https://example.com/some/very/long/path" }
```

**201 Created**
```json
{
  "code": "aB3xY9",
  "url": "https://example.com/some/very/long/path",
  "shortUrl": "http://localhost:3000/aB3xY9",
  "hits": 0,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Returns `400` on invalid JSON or a non-http(s) URL.

### GET /api/links

Returns a JSON array of all links in the same shape as above.

### GET /:code

Redirects (302) to the original URL and increments the hit counter.
Returns `404` if the code is unknown.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port to listen on |
| `BASE_URL` | `http://localhost:<PORT>` | Origin used in `shortUrl` values |
| `RAILWAY_PUBLIC_DOMAIN` | — | When `BASE_URL` is unset, used as `https://<domain>` |
| `PUBLIC_DIR` | — | Optional path to serve static files from |

When `PUBLIC_DIR` is set, `GET /` serves `index.html` from that directory.
A matching static file always takes priority over a short code of the same name.

## CORS

All responses include open CORS headers (`Access-Control-Allow-Origin: *`),
so a browser app running on any origin can call the API directly.
