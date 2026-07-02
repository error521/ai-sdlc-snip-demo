# Snip CLI

Zero-dependency Node.js CLI client for the [Snip](https://github.com/error521/ai-sdlc-snip-demo) URL shortener.  
Requires **Node ≥ 18** (uses global `fetch` and `http` built-ins; no `npm install` needed).

## Usage

```
snip add <url>    Shorten a URL and print the short link
snip ls           List all short links
snip open <code>  Open a short link in the OS browser
```

## Quick start

```sh
# Run directly
node cli.js add https://example.com/a/very/long/path

# Or use the platform wrapper
./snip add https://example.com/a/very/long/path   # Linux / macOS
snip.cmd add https://example.com/a/very/long/path  # Windows CMD
./snip.ps1 add https://example.com/a/very/long/path # PowerShell

# Install globally so the 'snip' command is on PATH
npm install -g .
snip add https://example.com
```

> **Linux / macOS:** if the `snip` wrapper isn't executable, run `chmod +x snip` once.

## Examples

```sh
$ snip add https://github.com/torvalds/linux
http://localhost:3000/aB3xY9

$ snip ls
CODE    HITS  URL
------  ----  ----------------------------------
aB3xY9     3  https://github.com/torvalds/linux

$ snip open aB3xY9
https://github.com/torvalds/linux
# → opens in default browser
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `SNIP_API` | `http://localhost:3000` | Backend base URL |

```sh
SNIP_API=https://short.example.com snip ls
```

## Error handling

- Invalid or non-http(s) URL → message on stderr, exit 1
- Unknown short code → message on stderr, exit 1
- Backend unreachable → message on stderr, exit 1

## Platform wrappers

| File | Platform |
|------|----------|
| `snip` | Linux / macOS (sh) |
| `snip.cmd` | Windows Command Prompt |
| `snip.ps1` | Windows PowerShell |
