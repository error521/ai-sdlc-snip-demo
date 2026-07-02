# Snip Design System

Visual language borrowed from lovable.dev: dark minimal, warm coral/orange gradient glow
behind the hero, pill-rounded chat-style input as the centrepiece, generously rounded
cards below, Inter type, lots of breathing room.

---

## Color Tokens

| CSS var | Value | Usage |
|---|---|---|
| `--bg` | `#0a0a0b` | Page background |
| `--surface` | `#111113` | Card / form backgrounds |
| `--surface-2` | `#1c1c1f` | Table headers, elevated surfaces |
| `--border` | `rgba(255,255,255,0.08)` | All subtle borders |
| `--text` | `#f4f4f5` | Primary body text |
| `--muted` | `#71717a` | Placeholders, sub-labels, secondary copy |
| `--accent-1` | `#ff6b6b` | Coral — links, glow source, button start |
| `--accent-3` | `#fb923c` | Orange — button gradient end |

### Accent gradient
```
linear-gradient(135deg, var(--accent-1), var(--accent-3))
```
Applied to: primary CTA button, interactive link colour.

### Hero glow (`body::before`, fixed)
```
radial-gradient(ellipse at 50% 0%,
  rgba(255,107,107,0.20) 0%,
  rgba(244,63,94,0.10)  35%,
  rgba(251,146,60,0.06) 55%,
  transparent           70%)
```
860 × 580 px, top-centre of viewport, `z-index: 0`.

---

## Typography

- **Font stack:** `'Inter', system-ui, -apple-system, sans-serif` (Inter loaded via Google Fonts CDN)
- **Smoothing:** `-webkit-font-smoothing: antialiased`

| Token | Value | Usage |
|---|---|---|
| `--text-xs` | `0.75rem` | Table labels, short-code badges |
| `--text-sm` | `0.875rem` | Button, notices, table body |
| `--text-base` | `1rem` | Input text |
| `--text-lg` | `1.125rem` | Hero subline |
| Hero `h1` | `clamp(2.5rem, 6vw, 3.75rem)` | Weight 700, letter-spacing −0.03em, lh 1.1 |

`h1` uses a white→grey gradient clip (`#fff 40% → #9f9faf 100%`) for a dimensional feel.  
Short-code links use `'Courier New', Consolas, monospace` at `--text-xs`, weight 700, `letter-spacing: 0.06em`.

---

## Spacing (4 px base)

| Step | Value |
|---|---|
| 2 | `0.5rem` |
| 3 | `0.75rem` |
| 4 | `1rem` |
| 6 | `1.5rem` |
| 8 | `2rem` |
| 12 | `3rem` |
| 16 | `4rem` |

Main content: `padding: var(--space-16) var(--space-4) var(--space-12)` (top, sides, bottom).  
Major sections separated by `gap: var(--space-8)`.  
Within the form section: `gap: var(--space-3)` between form, error, and result.

---

## Border Radii

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `8px` | Small inline elements |
| `--radius-md` | `16px` | Error / result notice cards |
| `--radius-lg` | `24px` | Links table card |
| `--radius-pill` | `9999px` | Form container + CTA button |

---

## Borders, Shadows & Glow

| Purpose | Value |
|---|---|
| Default border | `1px solid var(--border)` |
| Card shadow | `0 1px 3px rgba(0,0,0,0.5)` |
| Form ambient glow (always on) | `0 0 60px rgba(255,107,107,0.12)` |
| Form focus ring | `border-color: rgba(255,107,107,0.35)` + `box-shadow: 0 0 80px rgba(255,107,107,0.18)` |

---

## Snip Element → Design Mapping

| Element | Treatment |
|---|---|
| `<header>` | **Hero**: centred, max-width 560 px, gradient-clipped `h1`, muted `<p>` subline |
| `.form-section form` | **Chat pill**: `--surface` bg + `--border` + `--radius-pill`, ambient coral glow; gradient button inside right |
| `.error` | `--radius-md` card, `rgba(220,38,38,0.08)` bg, red border, `#fca5a5` text |
| `.result` | `--radius-md` card, `rgba(255,107,107,0.06)` bg, coral border, `--accent-1` link |
| `.table-section` | `--surface` card, `--radius-lg`, overflow hidden; `--muted` UPPERCASE column headers; monospace code links; row hover tint |
