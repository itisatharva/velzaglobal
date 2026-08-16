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

The version here reloads, and there is **no cookie and no `localStorage`** at all. The region model is: *geolocation decides; the flag menu overrides it for exactly one page view.* The choice rides in the `?_r=<code>` query parameter, which the switcher strips from the address bar as soon as the page loads — so a reload or any navigation arrives without it and falls back to geolocation.

`getRegion()` reads `data-velza-region` off `<html>`, which is baked into each `regions/<code>/*.html`. That attribute is the region the server *actually* served. The previous version guessed it from storage and defaulted to `hk`, which is why a visitor in India was served the India site while the menu read "Hong Kong (HQ)" — and why the "Hong Kong (HQ)" menu item did nothing for them (`setRegion()` no-ops when the target equals the current region, and the current region was wrongly believed to be `hk`).

Same `velzaRegionChanged` event, same `window.VelzaRegion` API. The switcher also clears any leftover `velzaRegion` cookie from the previous build; that cleanup can be deleted after one deploy cycle.

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
                    1. ?_r=<code>           (visitor's pick, one page view)
                    2. CF-IPCountry         (IN → in, PH → ph)
                    3. hk                   (everything else)
                          ↓
                  internal rewrite → /regions/<code>/…
                          ↓
                  regions/<code>/.htaccess resolves /aboutus → aboutus.html
```

The address bar keeps showing `https://www.velzaglobal.com/aboutus` throughout. Region folders return 404 if requested directly, so Google can't index three duplicate copies.

The `?_r=` override deliberately outranks the IP — without it the header menu could never move a visitor off their geo region at all.

It is equally deliberate that the override is **not persisted**. A visitor in India who picks Hong Kong sees Hong Kong for that page view; reload or click through to another page and they are back on the India site. Geolocation is the steady state, the menu is a peek. If you ever want the pick to stick, that is a change to `.htaccess` section 9a plus `stripParam()` in the switcher — not a config toggle.

---

## STEP 1 — Confirm your country source

**Status: done.** velzaglobal.com is on Cloudflare with the proxy active (Route A below).

> **You are not finished after enabling the proxy.** On current Cloudflare, `CF-IPCountry` is **no longer sent automatically** — it is a Managed Transform. Go to **Rules → Settings → Managed Transforms** and enable **"Add visitor location headers."**
>
> Without it, `.htaccess` section 9b never matches, section 9c catches everything, and **every visitor worldwide is served Hong Kong.** The failure is silent — the site looks perfectly healthy. Verify with the STEP 4 country checks before believing the routing works.

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

## STEP 3 — Deploy from GitHub (cPanel Git Version Control)

Deployment is driven by **`.cpanel.yml`** in the repo root. It rsyncs the site into the target directory, excludes the repo-only files, and fixes permissions. No more zip uploads.

**Take a full cPanel backup — files *and* the database — before the first production deploy.**

### 3a. Staging first

1. **cPanel → Subdomains** → create `staging.velzaglobal.com` with document root `/home/velzhsrg/staging` (outside `public_html`).
2. **Cloudflare → DNS** → the staging record must be **proxied (orange cloud)**. Grey-cloud means no `CF-IPCountry`, so region routing silently falls back to HK and you will test nothing.
3. **cPanel → Directory Privacy** → password-protect the staging docroot.
4. **cPanel → Git Version Control → Create:**
   - Clone URL `https://github.com/itisatharva/velzaglobal.git`
   - Repository path `/home/velzhsrg/repositories/velzaglobal`
   - Branch: the branch you are deploying
   - A private repo needs a deploy key or a personal access token.
5. **Manage → Update from Remote → Deploy HEAD Commit.** `.cpanel.yml` ships to `/home/velzhsrg/staging`.
6. Run **STEP 4** against `https://staging.velzaglobal.com`.

The root `.htaccess` recognises any `staging.` host and, for that host only, skips the www canonical redirect, skips HSTS, and sends `X-Robots-Tag: noindex, nofollow`. One `.htaccess` serves both environments — there is no second copy to drift.

### 3b. Promote to production

**`.cpanel.yml` targets production unconditionally.** Every
Update from Remote → Deploy HEAD Commit publishes to
`/home/velzhsrg/public_html`, i.e. straight to velzaglobal.com. There is
no path to edit and no staging branch of the manifest.

So deploying is: **merge to `main`, point the cPanel repo at `main`,
Update from Remote → Deploy HEAD Commit.**

Two consequences of the unconditional target:

1. **Whatever branch cPanel has checked out is what the public gets.**
   Check the branch in Git Version Control before deploying. Keep it on
   `main` and merge into `main` when you want something live.
2. **This manifest no longer sends anything to `/home/velzhsrg/staging`.**
   A staging cPanel repo running this file publishes to production. To keep
   staging alive, give it a long-lived branch whose `.cpanel.yml` keeps
   `export DEPLOYPATH=/home/velzhsrg/staging`, and never merge that one line
   into `main`.

The first line of the deploy log prints
`PUBLISHING branch <x> LIVE -> <path>`. Read it before believing a deploy
went where you intended.

**Before the first production deploy:** `public_html` still holds the old
manually-uploaded site, and there is no `rsync --delete`. Section 8 of
`.htaccess` serves any real file or directory at the document root as-is,
ahead of region routing — so leftover `assets/`, `region/` and old `.html`
files stay publicly reachable alongside the new site. Old page URLs still
301 correctly (sections 5–6 run first), so this is clutter and an indexing
risk, not breakage. Take the full backup, verify it, then empty
`public_html` except `.well-known/` before deploying into it.

**Deliberately no `rsync --delete`.** A wrong `DEPLOYPATH` combined with `--delete` would erase the live site; stale leftover files are the far cheaper failure. Consider enabling it only after a clean production deploy.

**Never touched by the deploy:** `/home/velzhsrg/private_config/` (the DB and SMTP credentials that `events/*.php` and the contact form read) and `events/*.log`.

**Permissions** are set by `.cpanel.yml` (folders `755`, files `644`). `.htaccess` at `600` causes a 500 error, so the manifest chmods every `.htaccess` explicitly.

**Still manual after deploy:** confirm the `send_reminders.php` cron entry still exists in **cPanel → Cron Jobs**. It is CLI-only and nothing in the repo configures it.

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

# root-level files (these ALL 404'd before the section 8 fix)
for f in favicon.ico apple-touch-icon.png site.webmanifest robots.txt sitemap.xml; do
  echo -n "$f -> "; curl -sI "https://www.velzaglobal.com/$f" | head -1
done                                                                    # all 200

# region folders are NOT public
curl -sI https://www.velzaglobal.com/regions/in/aboutus | head -1        # 404
curl -sI https://www.velzaglobal.com/regions/hk/index.html | head -1     # 404

# homepage canonicalisation
curl -sI https://www.velzaglobal.com/index.html | head -1                # 301 → /
curl -sI https://www.velzaglobal.com/index      | head -1                # 301 → /

# country routing — social handles are the fingerprint
curl -s -H "CF-IPCountry: IN" https://www.velzaglobal.com/ | grep -o velzaglobalin | head -1
curl -s -H "CF-IPCountry: DE" https://www.velzaglobal.com/ | grep -o velzaglobalhk | head -1

# ?_r= beats IP (one page view only)
curl -s -H "CF-IPCountry: IN" \
     "https://www.velzaglobal.com/?_r=hk" | grep -o velzaglobalhk | head -1

# ...and is NOT remembered: same visitor, no param, back to India
curl -s -H "CF-IPCountry: IN" https://www.velzaglobal.com/ | grep -o velzaglobalin | head -1

# a stale cookie from the old build must now be ignored
curl -s -H "CF-IPCountry: IN" -H "Cookie: velzaRegion=hk" \
     https://www.velzaglobal.com/ | grep -o velzaglobalin | head -1

# the switcher label must match the region served, not default to hk
curl -s -H "CF-IPCountry: IN" https://www.velzaglobal.com/ \
     | grep -o 'data-velza-region="[a-z]*"'                       # expect "in"

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

## STEP 5 — Cloudflare settings

### 5a. Check these before anything else

1. **SSL/TLS → Overview → encryption mode must be `Full (strict)`.** cPanel AutoSSL provides a valid origin certificate, so strict works. **`Flexible` produces an infinite redirect loop** against `.htaccess` section 4 and is the single most likely cause of a dead site at cutover. (The "Full" shown on the DNS card is the *DNS setup*, a different setting — check the SSL/TLS tab itself.)
2. **Rules → Settings → Managed Transforms → enable "Add visitor location headers."** See STEP 1 — without it there is no `CF-IPCountry` and everyone gets Hong Kong.
3. **Speed → Optimization → Rocket Loader: OFF.** This theme is jQuery + GSAP + Slick with inline init blocks. Rocket Loader defers them and reliably breaks exactly this kind of build, including the homepage curtain animation.
4. **SSL/TLS → Edge Certificates → Always Use HTTPS: ON.** Handles the upgrade at the edge so section 4's origin fallback rarely fires.

### 5b. Cache rule (mandatory)

Skipping this causes a confusing bug a fortnight later: an Indian visitor served a cached Hong Kong page.

Cloudflare → **Caching → Cache Rules**:

- **If:** `URI Path` does not start with `/shared/`
- **Then:** Cache eligibility → **Bypass cache**

`/shared/` is byte-identical across all regions, so it caches hard and you keep the speed. Only the region-dependent HTML bypasses. The `.htaccess` already sets `Cache-Control: private` and `Vary: Cookie` on HTML for browsers and other proxies.

If your host runs LiteSpeed Cache at server level, ask support to exclude HTML from the cache. The region is chosen from the visitor's IP, which is not a request header a cache can key on — so cached HTML will leak one country's site to another. Also confirm the cache does not strip query strings, or the `?_r=` override stops working.

### 5c. One conflict to settle

The dashboard's **"Block AI training bots"** setting contradicts `robots.txt`, which explicitly allows `GPTBot`, `ClaudeBot`, `PerplexityBot` and friends. Pick one — right now the two disagree.

---

## Rollback

Rename or delete `public_html/.htaccess`. That reverses the routing instantly — no cache to clear, no DNS wait. Keep an FTP client logged in during deployment.

---

## Routing bugs found and fixed during staging prep

Found by running the real `.htaccess` under Apache 2.4 and asserting on every route. All four were live defects in the restructured layout.

1. **Every root-level file returned 404** — `favicon.ico`, `apple-touch-icon.png`, `site.webmanifest`, `robots.txt` and `sitemap.xml`. Section 8 passed through `shared/ routing/ events/ server/ regions/` but nothing else, so root files fell through to 9c and were rewritten to `/regions/hk/<file>`, which does not exist. Fixed with an `-f`/`-d` pass-through in section 8. The `-d` rule uses `^(.+)$` so it cannot match `/` itself — matching `/` would pass the homepage through to a root `index.html` that does not exist and 404 the front page.

2. **`/regions/…` was publicly reachable** (200, not the intended 404). The guard lived only in the root `.htaccess`, but because each `regions/<code>/.htaccess` declares its own `RewriteEngine On`, **Apache replaces the parent's per-directory rewrite ruleset rather than inheriting it** — so the root guard never ran for those paths. Google would have indexed three duplicate copies of the site. The guard now also lives in each region `.htaccess`, keyed on `THE_REQUEST` so internal rewrites still pass.

3. **`/index.html` redirected to `/index`, not `/`.** The generic `.html`-stripping rule ran first and matched, because its oracle file `regions/hk/index.html` exists, leaving the index-specific rule below it unreachable. The index rules now come first, and a bare `/index` also 301s to `/`.

4. **`https://velzaglobal.com//portfolio`** — malformed canonical (doubled slash, non-www) in `regions/in/portfolio.html`.

## Pre-existing issues I did NOT change

1. ~~`theme-preview-color-styler.css`~~ and ~~`contact-handshake.webp`~~ — **not actually broken.** Both references are inside HTML comments on all 69 pages, so neither is ever requested. The earlier claim of "a 404 on every page view" was wrong.

2. **`apple-touch-icon-*-precomposed.png`** — the four missing icons were in `regions/in/portfolio.html` (not `comingsoon.html`). **Fixed**: that page now uses the same icon block as `hk`/`ph`, all of which exist.

3. **`regions/in/index.html` is still a stale revision**, hard-coding `page-luxury-beverage.html`, `page-lifestyle-essentials.html` and `page-pure-italian-spirits.html`. The `.htaccess` section 5 301s keep them resolving. `regions/in/portfolio.html` also still carries Skilltech demo metadata (`og:site_name` = "SkilltechWebDesign.com", theme boilerplate `og:description`). The real fix is re-syncing both pages from `hk/`.

4. **`hreflang` is not applicable to this architecture, and the identical canonicals are correct.** There is exactly one URL per page; region is chosen server-side by cookie then `CF-IPCountry`. `hreflang` requires distinct crawlable URLs per locale, and section 2 deliberately 404s direct `/regions/…` access, so none exist.
   The real consequence: **Googlebot crawls from the US, so only the HK variant will ever be indexed.** Getting IN and PH content into search results requires exposing genuine per-region URLs — an architectural change, not a meta-tag one.

5. **Unused weight still shipped:** ~90 Skilltech demo images, ~20 GSAP plugins the theme never loads (its own `___Actually Used.txt` names 4), `spectrum`, `clipboard`, `hc-offcanvas-nav-old.js`, `icomoon/demo.html`, `simple-forms/help/`, and `about-us` in four formats. Removing these is safe but touches files, so I left them.

6. **`events/update_issue.php`** concatenates an `intval()`-cast id into a `SELECT`. `intval` blunts the risk, but the query should be prepared like the `UPDATE` beside it already is.

6. **Unused weight still shipped:** ~90 Skilltech demo images, ~20 GSAP plugins the theme never loads (its own `___Actually Used.txt` names 4), `spectrum`, `clipboard`, `hc-offcanvas-nav-old.js`, `icomoon/demo.html`, `simple-forms/help/`, and `about-us` in four formats. Removing these is safe but touches files, so I left them.
