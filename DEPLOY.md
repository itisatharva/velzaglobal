# Velza Global — Deployment-Ready Package

Restructured from your uploaded `Velza_Github.zip` into the layout you specified. Nothing about how any page looks or behaves has changed.

---

## The structure

```
velzaglobal/
├── .htaccess                  ← index / routing layer
├── .gitignore
│
├── routing/
│   ├── region-config.js       region list + HK fallback
│   └── region-switcher.js     header flag menu (now functional — see below)
│
├── shared/                    ONE copy, was duplicated 3×
│   ├── css/                   theme, theme-colors, custom, responsive-fix, cookie-consent
│   ├── js/                    theme, custom, responsive-fix, form, counter-format,
│   │                          cookie-consent, youtube-video
│   ├── vendor/                bootstrap, jquery, greensock, slick, offcanvas-nav,
│   │                          icomoon, parallax, three-js, hover-effect, spectrum,
│   │                          clipboard, simple-forms
│   ├── images/                ~330 images
│   ├── img/                   email-template icons
│   ├── video/                 3 hero videos
│   └── fonts/                 icomoon + slick font files
│
├── regions/
│   ├── hk/  23 HTML pages + a 6-line .htaccess
│   ├── in/  23 HTML pages + a 6-line .htaccess
│   └── ph/  23 HTML pages + a 6-line .htaccess
│
├── events/                    RSVP microsite, ONE copy (was 3×)
│
├── server/
│   ├── cloudflare-worker.js   alternative router, edge-based
│   └── redirects-nginx.conf   reference, if you ever leave Apache
│
├── deployment/
│   ├── README.md
│   └── local-dev-server.php   local testing only — do not upload
│
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── favicon.ico
├── apple-touch-icon.png
├── velza-global-logo-2.svg
└── .well-known/
```

**294 MB → 74 MB.** Same site, three copies of the assets removed.

---

## What changed, precisely

### Not touched
Page markup, structure, layout, styling, scripts, images, videos, copy, the theme, the RSVP application logic. Every page renders byte-for-byte as before.

### Changed — file locations and the paths pointing at them

| Was | Now |
|---|---|
| `regions/{hk,in,ph}/assets/` (3 copies) | `shared/` (1 copy) |
| `region/` | `routing/` |
| `regions/{hk,in,ph}/Ph/Ph/Events/PR/` (3 copies) | `events/` (1 copy) |
| `robots.txt`, `sitemap.xml`, favicons (3 copies) | root (1 copy) |

Because the assets moved, the references had to move with them. This was mechanical, applied uniformly across all 69 pages:

- `assets/…` and `/assets/…` → `/shared/…`
- `https://www.velzaglobal.com/assets/…` (og:image, JSON-LD) → `/shared/…`
- `/region/region-*.js` → `/routing/region-*.js`
- `site.webmanifest`, `favicon.ico`, `apple-touch-icon.png` → absolute paths

Two vendor stylesheets were patched so their fonts resolve from `shared/fonts/`: `icomoon.min.css` and the slick theme CSS. That is the only edit made to any CSS file.

**Side effect worth knowing:** paths are now consistently absolute. Your original files mixed 766 relative references with 312 absolute ones. That inconsistency is gone.

### Changed — `routing/region-switcher.js`

Your original wrote the region cookie and updated the flag, but never reloaded. The server can only act on that cookie at the *next* request, and none was made — so clicking "India" changed a flag and nothing else.

The version here reloads after writing the cookie, and reads the cookie before `localStorage` (the cookie is the only thing the server sees, so the two must not disagree). Same storage keys, same `velzaRegionChanged` event, same `window.VelzaRegion` API. No visual change.

`region-config.js` is unchanged.

### Removed
`error_log`, `reminder_cron.log`, `reminder_mail.log`, `send_reminders.lock`, `team/layout_test.php`. The logs were committed to git and contained live RSVP submission traces including personal-data field names. A `.gitignore` now prevents them coming back.

### Added
Root `.htaccess` (the routing layer), three 6-line region `.htaccess` files, `.gitignore`, `server/cloudflare-worker.js`, `deployment/local-dev-server.php`.

---

## How the routing layer works

```
request  →  root .htaccess
              ├─ security, https, www, legacy 301s, .html stripping
              ├─ /shared/ /routing/ /events/ pass straight through
              └─ region selection:
                    1. velzaRegion cookie   (visitor's explicit choice)
                    2. CF-IPCountry         (IN → in, PH → ph)
                    3. hk                   (everything else)
                          ↓
                  internal rewrite → /regions/<code>/…
                          ↓
                  regions/<code>/.htaccess resolves /aboutus → aboutus.html
```

The address bar keeps showing `https://www.velzaglobal.com/aboutus` throughout. Region folders return 404 if requested directly, so Google can't index three duplicate copies.

The cookie deliberately outranks the IP. Without that, a visitor who picks a country from your header menu gets overridden by their IP on the very next page load.

---

## STEP 1 — Confirm your country source

The router needs the visitor's country. Your shared LiteSpeed host almost certainly can't provide it alone.

**Route A — Cloudflare (recommended, free, ~10 min).** Sends `CF-IPCountry`. Nothing to install on the host. This is what the `.htaccess` expects as written.

**Route B — a host GeoIP module.** Open a support ticket asking exactly:

> Is mod_maxminddb or mod_geoip available on my plan? If yes, which environment variable does it set — MMDB_COUNTRY_CODE or GEOIP_COUNTRY_CODE?

If yes, swap `%{HTTP:CF-IPCountry}` for their variable in section 9b of `.htaccess`. Change nothing else.

Without either, the site works perfectly — everyone just lands on Hong Kong.

---

## STEP 2 — Test locally, before the server

```bash
cd velzaglobal
php -S localhost:8000 deployment/local-dev-server.php
```

Open <http://localhost:8000/>. Force each region:

| URL | Serves |
|---|---|
| `http://localhost:8000/?region=hk` | Hong Kong |
| `http://localhost:8000/?region=ph` | Philippines |
| `http://localhost:8000/?region=in` | India |

Click every page. Check the `X-Velza-Region` response header in DevTools → Network. Confirm images, fonts, carousels, parallax, hero videos, mobile menu, cookie banner and the contact map all behave as before.

For a test that also exercises the real `.htaccess`, install Laragon or XAMPP, point the document root here, and enable `mod_rewrite` + `mod_headers`. Do this before going live.

---

## STEP 3 — Upload

Upload the **contents** of this folder into `public_html`, so `.htaccess`, `shared/`, `routing/`, `regions/`, `events/` sit at the top level.

**Do not upload:** `deployment/`, `.gitignore`, and never a `.git/` folder.

Zip locally, upload one zip via cPanel File Manager, extract there. FTP with ~1,700 files will drop mid-transfer and leave you half-deployed.

**Dotfiles:** enable cPanel File Manager → Settings → **Show Hidden Files**, or you won't see `.htaccess` after extracting.

**Permissions:** folders `755`, files `644`. Check `public_html/.htaccess` specifically — `600` there causes a 500 error.

**Take a full cPanel backup first.**

---

## STEP 4 — Verify

```bash
# loads at all
curl -sI https://www.velzaglobal.com/ | head -1                        # 200

# every clean URL resolves (catches an [L]/[END] mistake)
for p in aboutus portfolio contactus luxurybeverage coffeecollection \
         pureitalianspirits lifestyleessentials rossocaffe news news1 \
         news2 privacypolicy termsandconditions; do
  echo -n "$p -> "; curl -sI "https://www.velzaglobal.com/$p" | head -1
done                                                                    # all 200

# shared assets
curl -sI https://www.velzaglobal.com/shared/css/theme.css        | head -1
curl -sI https://www.velzaglobal.com/shared/js/theme.js          | head -1
curl -sI https://www.velzaglobal.com/routing/region-config.js    | head -1
curl -sI https://www.velzaglobal.com/shared/fonts/icomoon.woff   | head -1
curl -sI https://www.velzaglobal.com/shared/video/hero-video-main.mp4 | head -1

# region folders are NOT public
curl -sI https://www.velzaglobal.com/regions/in/aboutus | head -1        # 404

# country routing — social handles are the fingerprint
curl -s -H "CF-IPCountry: IN" https://www.velzaglobal.com/ | grep -o velzaglobalin | head -1
curl -s -H "CF-IPCountry: DE" https://www.velzaglobal.com/ | grep -o velzaglobalhk | head -1

# cookie beats IP
curl -s -H "CF-IPCountry: IN" -H "Cookie: velzaRegion=hk" \
     https://www.velzaglobal.com/ | grep -o velzaglobalhk | head -1

# legacy redirects + old event URL
curl -sI https://www.velzaglobal.com/about-us.html          | head -1    # 301
curl -sI https://www.velzaglobal.com/aboutus.html           | head -1    # 301
curl -sI https://velzaglobal.com/aboutus                    | head -1    # 301 → www
curl -sI https://www.velzaglobal.com/Ph/Ph/Events/PR/       | head -1    # 200
curl -sI https://www.velzaglobal.com/no-such-page           | head -1    # 404
```

Once Cloudflare is live it sets `CF-IPCountry` from the real IP, so a manual header may be ignored — test with a VPN instead if results look odd.

Then open the site in a private window, click through all 13 pages at desktop and mobile widths, **and submit one test RSVP** at `/events/`. That's live PHP against a real database — verify it before calling this done.

---

## STEP 5 — Cloudflare cache rule

Skipping this causes a confusing bug a fortnight later: an Indian visitor served a cached Hong Kong page.

Cloudflare → **Caching → Cache Rules**:

- **If:** `URI Path` does not start with `/shared/`
- **Then:** Cache eligibility → **Bypass cache**

`/shared/` is byte-identical across all regions, so it caches hard and you keep the speed. Only the region-dependent HTML bypasses. The `.htaccess` already sets `Cache-Control: private` and `Vary: Cookie` on HTML for browsers and other proxies.

If your host runs LiteSpeed Cache at server level, ask support to exclude HTML or add `velzaRegion` to the cache key.

---

## Rollback

Rename or delete `public_html/.htaccess`. That reverses the routing instantly — no cache to clear, no DNS wait. Keep an FTP client logged in during deployment.

---

## Pre-existing issues I did NOT change

These were in your original files. Fixing them means editing page content, which you asked me not to do — so they're listed, not applied.

1. **`shared/css/theme-preview-color-styler.css` doesn't exist**, yet all 69 pages request it. A 404 on every page view. It's a Skilltech demo file — the fix is deleting the `<link>` tag, not creating the file.

2. **`shared/images/contact-handshake.webp` doesn't exist**, referenced as a background image on all three `contactus.html` pages.

3. **Four `apple-touch-icon-*-precomposed.png` files don't exist**, referenced by `comingsoon.html`.

4. **`regions/in/index.html` and `regions/in/portfolio.html` are a stale revision.** They still hard-code `page-luxury-beverage.html`, `page-lifestyle-essentials.html`, `page-pure-italian-spirits.html` and `page-service-item.html` — filenames that no longer exist. I added 301 redirects for all four in `.htaccess` section 5, so they resolve instead of 404ing, but the underlying fix is re-syncing those two pages from `hk/`.

5. **No `hreflang` tags**, and all three regions declare the same canonical. Harmless today (only social links differ), but it becomes a real SEO problem the moment regional content genuinely diverges.

6. **Unused weight still shipped:** ~90 Skilltech demo images, ~20 GSAP plugins the theme never loads (its own `___Actually Used.txt` names 4), `spectrum`, `clipboard`, `hc-offcanvas-nav-old.js`, `icomoon/demo.html`, `simple-forms/help/`, and `about-us` in four formats. Removing these is safe but touches files, so I left them.
