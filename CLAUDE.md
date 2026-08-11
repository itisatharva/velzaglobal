# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **static, hand-authored marketing site** for Velza Global (vendored "DarkTheme" / SK
template), serving **three regional content sets from one domain** via an Apache geo-routing
rewrite, plus an embedded PHP RSVP/event subsystem.

There is **no build system**: no `package.json`, bundler, test suite, or linter. Editing means
editing the shipped file directly. The repository root **is** the web root — what is committed
is what lands in `public_html/`.

Read `README.md` first for deployment and the operational checklist. This file covers the
things that require reading several files to work out.

## Layout

```
.htaccess           Master Apache config — geo-routing, canonical URLs, security, caching
assets/             Shared CSS/JS/images/video — ONE copy, used by all three regions
region/             region-config.js (valid codes) + region-switcher.js (cookie + reload)
regions/hk/*.html   Hong Kong / HQ — global default and master copy
regions/ph/*.html   Philippines
regions/in/*.html   India
Ph/Events/PR/       RSVP / event subsystem (PHP + MySQL), not geo-routed
deployment/         Docs and reference configs; excluded from deploy
.github/workflows/  CI gates + FTPS deploy
```

## The two constraints that break the site if violated

### 1. `assets/` must stay at the web root

Page HTML references assets **relatively** (`assets/css/theme.css`, ~55 per page). Under
geo-routing the browser URL is `/aboutus` while the file served is `regions/in/aboutus.html`,
so those references resolve against `/` — to `/assets/...` at the root, which is where the
single shared copy lives.

Moving `assets/` back inside region folders breaks every stylesheet, script and image on the
site. The three copies were byte-identical, so consolidating also cut the repo 190 MB → 63 MB.
A CI check in `.github/workflows/deploy.yml` enforces this.

Internal page links are already root-absolute (`/aboutus`) and survive the rewrite fine — the
asymmetry between the two link styles is the whole reason this constraint exists.

### 2. HTML must never be cached by a shared cache

The same URL returns Indian, Philippine or Hong Kong content depending on the visitor. Any
shared cache that stores one visitor's HTML and replays it to another serves the wrong region.

`.htaccess` §9 sets HTML to `private, no-cache` with `Vary: CF-IPCountry, Cookie`. The old
`public, max-age=3600` was safe for a single-region site and is not safe now. Do **not** add a
Cloudflare "Cache Everything" page rule. Static assets are region-independent and stay cached
for a year, so this costs almost nothing.

## The three-copy model

The regions are **duplicated, not templated**. A content or markup fix must be applied to all
three or they drift. CI fails if the regions stop exposing the same set of pages, but it cannot
detect content drift — diff before and after:

```bash
diff -rq regions/hk regions/ph
diff regions/hk/index.html regions/in/index.html
```

Legitimately region-specific (do not "fix" these): social media URLs — `velzaglobalhk` /
`velzaglobalph` / `velzaglobalin` across Facebook, Instagram, LinkedIn and X, in the nav,
footer, and the JSON-LD `sameAs` block. Everything else that differs is drift.

Current state: `hk` ↔ `ph` differ only in social links — effectively in sync. `hk` ↔ `in`
differ by ~99 lines in `index.html`: `in/` carries an older portfolio markup variant, duplicated
comment blocks, an `<h2>` demoted to `<h1>`, and links to four template pages that never
existed (`page-luxury-beverage.html`, `page-lifestyle-essentials.html`,
`page-pure-italian-spirits.html`, `page-service-item.html`). Those four are now 301'd to the
correct canonical URLs in `.htaccess` §3C, so they no longer 404 — but the markup drift in
`regions/in/` is still unresolved and should be reconciled against `hk`.

## Geo-routing

Implemented entirely in `.htaccess` §3L (resolution) and §3M (mapping).

**Precedence: `velzaRegion` cookie → `CF-IPCountry` header → `hk` default.** The cookie is an
explicit human choice through the on-site switcher and always wins, so a visitor who switches
region is never bounced back by geo-IP. `IN → in`, `PH → ph`, everything else — including HK
itself and Cloudflare's non-country codes (`XX`, `T1`) — → `hk`.

The chain is expressed as four rules each guarded by `RewriteCond %{ENV:VELZA_REGION} ^$`,
which is what makes it if/else-if rather than four rules that all fire. The cookie regex
constrains the value to `(hk|ph|in)`, so a crafted cookie cannot inject a path into the rewrite
target.

Mapping is an **internal** rewrite (no `[R]` flag) — the address bar keeps showing
`www.velzaglobal.com/aboutus`. `§3D` 301s any direct `/regions/xx/...` URL back to the
canonical path so the internal layout is never publicly linkable, matching on `THE_REQUEST` so
the internal rewrite (which does not alter `THE_REQUEST`) cannot loop.

### Rule-ordering traps, learned the hard way

- **`§3J`'s real-file passthrough uses `^(.+)$`, not `^`.** A bare `^` also matches the
  homepage, whose `REQUEST_FILENAME` is the document root — a directory — so it matched `-d`
  and `[END]`ed before region mapping. Symptom: every page works, the homepage 404s.
- **`[END]` terminates all rewriting.** `§3J` passes `^(?:assets|region|Ph)` through with
  `[END]`, so *any* deny rule for a path under those prefixes must sit **above** it. The
  `team/` portal block lives in `§3A` for exactly this reason — placed in `§5B` next to the
  related `<Files>` rules, it was unreachable and the portal stayed publicly readable.
- **`.html`/`.php` stripping is scoped to single-segment top-level URLs.** Unscoped, it
  rewrites `/Ph/Events/PR/index.html` and `host_view.php` and breaks the RSVP app.
- **HTTPS enforcement trusts proxy headers before Apache's `%{HTTPS}`.** Cloudflare terminates
  TLS, so `%{HTTPS}` is not authoritative. Cloudflare SSL mode must be **Full (strict)**; in
  Flexible mode CF always talks HTTP to the origin and these rules loop forever.

### Testing the rules

Apache 2.4 with `mod_rewrite` is needed — a plain static server ignores `.htaccess` entirely.
Simulate Cloudflare with headers: `-H "CF-IPCountry: IN"`, `-H "Cookie: velzaRegion=ph"`,
`-H "X-Forwarded-Proto: https"`, and `-H "Host: www.velzaglobal.com"` to avoid the canonical
redirect. On macOS, Apache cannot read `~/Desktop` or `~/Documents` (system privacy
protection) — copy the site elsewhere to test.

The ruleset was validated against a local Apache with a 53-case matrix covering every
country/cookie combination, canonical redirects, shared-path exclusions, the security denies,
and caching headers.

## Front-end JS load order (it matters)

Per page: jQuery → Bootstrap 5.1.3 → hc-offcanvas-nav → GSAP (+ScrollTrigger, ScrollSmoother,
ScrollToPlugin) → slick → parallax → simple-forms → `form.js` → `theme.js` →
`counter-format.js` → `responsive-fix.js` → Leaflet (unpkg CDN, no SRI) → `custom.js` →
`cookie-consent.js` → `/region/region-config.js` → `/region/region-switcher.js`.

- `theme.js` (3.3k lines) is the vendored template engine. Treat as vendor code.
- `counter-format.js` must load **after** `theme.js`: it strips the thousands separator
  `toLocaleString("en-US")` adds to `.sk__counter[data-counter-plain]` (so a year renders
  `2026`, not `2,026`), re-stripping via `MutationObserver`.
- `responsive-fix.js` must load **after** `theme.js` and deliberately does *not* hook
  resize/load/visibilitychange — ScrollTrigger already does, and duplicating them caused a
  feedback loop that force-closed the offcanvas nav. Read its header comment before editing.

## Region switcher

`region/region-switcher.js` writes the `velzaRegion` cookie (path `/`, 1 year, `SameSite=Lax`)
plus `localStorage`, then **reloads the page** — regional content is chosen server-side, so
without a reload only the switcher label would change. The cookie is authoritative (it is the
only store the server can see); `localStorage` is a fallback that `init()` uses to restore an
expired cookie. `VelzaRegion.set(code, { reload: false })` opts out for callers that want to
handle the transition via the `velzaRegionChanged` event.

`region-config.js` (`window.VELZA_REGIONS`) is the source of truth for valid codes. Dropdown
open/close behaviour is separate, in `assets/js/custom.js`.

## Analytics & consent

GTM `GTM-W333F6RK` is hard-coded in the `<head>` of all 23 pages in all three regions.
`assets/js/cookie-consent.js` (`window.VelzaCookieConsent`) drives it via Google Consent Mode
v2, with Consent Mode defaults inlined *above* the GTM snippet on every page. Config is the
`COOKIE_CONFIG` block at the top of that file; `analyticsId` is intentionally empty to avoid
double-counting alongside GTM. Bump `COOKIE_CONSENT_VERSION` to re-prompt all visitors.
See `deployment/cookie-consent.md`.

## Backend: two independent PHP systems

### 1. Simple Forms — contact & subscribe (`assets/vendor/simple-forms/`)
Third-party PHP mailer wired up in `assets/js/form.js` for `#contact-form-1` and
`#sk__subscribe-form-1`, posting to `sendmail.php`. **Non-functional as committed** —
`config.php` holds template placeholders (`your-email@gmail.com`, SMTP off) and `form.js` has
`siteKey: "CHANGEME"`. Both sides need real values.

### 2. RSVP / Event Management (`Ph/Events/PR/`)
Separate PHP + MySQL app ("Velza RSVP & Event Management System", 1.0.0-alpha.2) for an August
2026 Philippines press conference, with its own bundled PHPMailer. Tables `registrations` and
`rsvp_sequences`; timezone pinned to `Asia/Manila`.

- `index.html` — public RSVP form
- `submit.php` — validates, dedupes on email/contact, allocates an ID from `rsvp_sequences`
  under `FOR UPDATE` in a transaction (`VGPH-2026-PC-G00001`), inserts, sends confirmation
- `host_view.php` — check-in table + AJAX toggle **(denied in `.htaccess` §5B)**
- `update_issue.php` — JSON toggle endpoint **(denied in §5B)**
- `send_reminders.php` — CLI-only, `flock`-protected, dry-run unless `--send`
- `team/` — unfinished portal **(denied in §3A)**; `login.php` checks CSRF and never
  authenticates; `dashboard.php` and the `users/`/`guests/`/`reports/`/`audit/` dirs are empty

Credentials load from `/home/velzhsrg/private_config/{rsvp_db,rsvp_smtp}.php` — **outside the
web root, server-only**. Never inline them.

This app was previously duplicated into all three regions with paths hard-coded to
`/Ph/Events/PR/...` while sitting at `Ph/Ph/Events/PR/`. It is now a single copy at the path
its own code expects.

## Known issues (pre-existing unless noted)

**Mitigated at the web-server layer, not fixed in the application:**

1. `host_view.php` renders every registrant's name, email, phone, emergency contact and number
   with **no authentication**, and `?toggle&id=N` mutates rows; `update_issue.php` likewise has
   no auth or CSRF. Both now return 403 via `.htaccess` §5B, and `team/` via §3A. The
   application-level fix is still outstanding — do not simply delete those blocks.
2. Server logs with real attendee email addresses (`reminder_mail.log`) are now gitignored, so
   they stay off GitHub. They still exist on the server.

**Unfixed:**

3. **SQL injection shape in `Ph/Events/PR/update_issue.php:25`** —
   `"SELECT issued FROM registrations WHERE id = " . $id`. `intval()`-cast so not currently
   exploitable, but it is the one unparameterized query in the codebase.
4. **`issued` column type conflict** — `update_issue.php` writes integers (`bind_param('ii')`),
   while `host_view.php` and `submit.php` use the strings `"Yes"`/`"No"`. Whichever endpoint
   the UI calls, the other corrupts the column.
5. `host_view.php:3` sets `display_errors = 1`, leaking paths and SQL on failure.
   `submit.php` correctly sets `0`.
6. `team/login.php` accepts no credentials — validates CSRF, then falls through.
7. `regions/in/` markup drift (see "three-copy model").
8. Contact/subscribe forms inert — placeholder mail config and `CHANGEME` reCAPTCHA key.
9. Leaflet loads from `unpkg.com` with no SRI; `sitemap.xml` hard-codes `lastmod 2026-08-10`
   on every URL.
10. Unoptimized media — a 5.2 MB PNG and a 7.8 MB MP4 dominate page weight; no WebP/AVIF
    variants. Now single-copy rather than tripled, but still the main performance cost.
11. No CSP header.
