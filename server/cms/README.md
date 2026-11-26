# CMS article pages (server-side)

Renders Strapi-managed Blog and News entries as full article pages that share the exact shell of the
live static article pages. Not served to browsers directly: `/server/` is not a public path (the
`.htaccess` routing sends it into a region folder, where it does not exist).

| File | Purpose |
|---|---|
| `build-templates.mjs` | Builds `templates/<region>/<blogs|news>.html` from the live reference articles. Run `node server/cms/build-templates.mjs` after changing the article page shell. |
| `templates/` | Generated. Byte-identical to the reference pages except four markers: `<!--CMS:SEO-->`, `<!--CMS:ARTICLE-->`, `<!--CMS:RELATED-->`, `<!--CMS:NAV-->`. `templates/index.mjs` exports the same templates as strings for the Worker bundle. |
| `markers.mjs` | The four markers, free of Node imports so the renderer can be bundled into the Worker. |
| `render-article.mjs` | `renderArticle({ type, slug, region, template, config })` → `{ status, headers, body }`. 200 with full HTML; 404 for unknown, draft, unpublished, deleted or other-region slugs; 503 when the CMS fails (no stale content); `body` is null for errors so the caller serves the region's own error page. |
| `blocks.mjs`, `html.mjs` | Strapi Blocks → HTML, escaping, link sanitising, JSON-LD serialisation. |

Runtime-agnostic (only `fetch`), so the same code can run in:

- **a Cloudflare Worker** (render on request; static files are tried first) — wired into
  `server/cloudflare-worker.js`: only after the origin answers 404 for `/blogs/<slug>` or `/news/<slug>`, and only when
  the Worker has `CMS_BASE_URL` set (optional `SITE_ORIGIN`, `CMS_MEDIA_BASE_URL`; no token). See
  [Worker deployment topology](#worker-deployment-topology), or
- **a static-generation step** (write `regions/<r>/<type>/<slug>.html` on publish, delete on unpublish).

Which one is used in production is an open decision (hosting/infrastructure). Until it is made and
deployed, `shared/js/velza-cms/cms-config.js` keeps `detailPages: false` (and `baseUrl: null`).

Rules:

- Static article files always take precedence over CMS pages with the same URL.
- `config.siteOrigin` builds canonical and Open Graph URLs. The live pages use `https://www.velzaglobal.com`;
  the production value is pending the canonical/URL policy decision (F4b/F4c).
- Publication dates (visible date, JSON-LD `datePublished`/`dateModified`, related cards) are the calendar date in
  the page region's time zone (`timeZoneByRegion`: Asia/Hong_Kong, Asia/Kolkata, Asia/Manila), because Strapi stores
  `datetime` values in UTC. Date-only values are shown as-is; `article:published_time` stays the full UTC timestamp.
- `og:locale` is per region (`en_HK`, `en_IN`, `en_PH`); the existing static pages use `en_HK` everywhere (to confirm).
- Not implemented pending Phase 6 decisions: news expiry (F2), future-date embargo (F3), redirects for changed slugs.

## Worker deployment topology

Not deployed. Required shape, to be proven on staging before any production route:

```
visitor ─► Cloudflare ─► [Worker only on <host>/blogs/* and <host>/news/*] ─► cPanel origin (.htaccess)
                         every other path goes straight to the origin, no Worker
```

- **Routes:** only `<host>/blogs/*` and `<host>/news/*`. Never `<host>/*`: `.htaccess` stays the only router.
- **Pass-through first:** the Worker sends the visitor's request to the origin unchanged and returns the origin's
  response as-is — static pages, redirects (never followed), 403, 5xx, listings. It renders a CMS page only for a
  GET/HEAD of `/blogs/<slug>` or `/news/<slug>` that the origin answered with **404**. If the CMS has no published entry
  of that region, the origin's own 404 page is returned. If the CMS fails, the region's 503 page is fetched through
  its public URL `/503?_r=<region>` and returned with status 503 and `Retry-After`; this applies only to article URLs
  that have no static file, so static pages are unaffected by a CMS outage.
- **Never `/regions/…`:** the origin answers external `/regions/` requests with 404 on purpose (`.htaccess` section 2
  and each region's `.htaccess`), so the Worker never requests them.
- **Region:** the Worker applies `.htaccess` section 9 in the same order — `?_r=in`, `?_r=ph`, `?_r=hk` (raw query,
  case-insensitive), then the `CF-IPCountry` request header (`IN`, `PH`), else `hk`. The integration tests parse
  section 9 from the real `.htaccess` and fail if the two diverge.
- **CMS page headers:** the renderer's (`Cache-Control: private, no-cache`), plus `X-Velza-Source: cms`,
  `X-Velza-Region`, and the origin's section-12 security headers copied from its 404 response (including staging's
  `X-Robots-Tag: noindex`).

Assumptions that Node tests cannot prove — verify each on staging:

1. **`CF-IPCountry` is on the request the Worker receives.** `.htaccess` reads this header at the origin; the Worker
   reads it from its incoming request. It is added by the Managed Transform "Add visitor location headers"
   (DEPLOY.md STEP 1). If Cloudflare added it only after the Worker, the Worker would pick `hk` while the origin picked
   the visitor's country for CMS-only articles. Check: from an India and a Philippines VPN, a CMS-only article of that
   region renders (`X-Velza-Region` matches) and a static page of the same request shows the same region.
2. **No recursion:** a Worker's `fetch()` of a URL on its own route goes to the origin, not back into the Worker
   (Cloudflare same-zone subrequest behaviour). Check: a static article on staging returns without `X-Velza-Source`
   and the Worker's metrics show one invocation per request.
3. **Origin behaviour:** the tests use a model of the `.htaccess` rules (`integration/tests/helpers/origin-sim.mjs`),
   not Apache/LiteSpeed. Staging must confirm the real 404/301/403 responses for article URLs.
4. **Password-protected staging:** the visitor's request (including any `Authorization` header for cPanel Directory
   Privacy) is passed to the origin unchanged, but the separate `/503?_r=` error-page fetch carries no credentials.
   On a protected staging host a CMS outage therefore returns status 503 with a plain-text body instead of the
   styled 503 page. Production (no password) is unaffected.

### Build and configuration (`server/wrangler.jsonc`, `server/package.json`)

- `server/` is excluded from the cPanel deploy (`.cpanel.yml`), so the Worker tooling never reaches `public_html`.
  `server/node_modules/`, `server/.wrangler/` and `server/.dev.vars` are git-ignored.
- Wrangler is **not installed yet**. Install it once, pinned, in `server/`: `npm install --save-dev --save-exact
  wrangler@<version>` (this writes `package.json`/`package-lock.json`; choose the version deliberately). Then set
  `compatibility_date` to a date that version supports.
- Wrangler bundles `main = "cloudflare-worker.js"` with esbuild, following its imports into `server/cms/` and
  `shared/js/velza-cms/`. The integration tests bundle it the same way (esbuild, ESM, no Node built-ins, only a
  default export) and rerun the key routing checks on the bundle.
- `wrangler.jsonc` is staging-only: name `velza-cms-articles-staging`, `workers_dev: false`, `preview_urls: false`,
  routes only `PLACEHOLDER-STAGING-HOST/blogs/*` and `/news/*` in `PLACEHOLDER-ZONE` (a deploy fails until they are
  replaced), and plain vars only. `CMS_BASE_URL` is empty, which keeps CMS rendering off (pure pass-through). A test
  fails if a production host, another path, a secret-like value or extra bindings appear.
- `npm run check` = `wrangler deploy --dry-run` (bundles and validates, uploads nothing).

### Local test in the Workers runtime (before any route exists)

All on 127.0.0.1; nothing is uploaded:

1. `cd integration && node tools/worker-runtime-upstream.mjs` — origin on :8098 (the website files behind the
   `.htaccess` model, honouring `CF-IPCountry`), mock CMS on :1399 with one published entry per region at the
   regional midnight boundary, control on :8097.
2. `cd server && npm run dev:local` — `wrangler dev` on :8787 with `--local-upstream 127.0.0.1:8098
   --upstream-protocol http`, so the Worker's own `fetch(request)` goes to the local origin (Wrangler rewrites the
   request host to the upstream). Check the flag names against `npx wrangler dev --help` for the pinned version.
3. `cd integration && node tools/worker-runtime-smoke.mjs` — 11 checks: pass-through of pages, assets, static
   articles, redirects and error pages (byte-compared with the origin); CMS fallback by `?_r=` and by `CF-IPCountry`;
   region isolation; regional dates via the runtime's `Intl` time-zone data; origin 403/500 not replaced; HEAD; CMS
   outage limited to missing articles.

### Staging test (after the values exist)

1. Staging host proxied by Cloudflare (orange cloud) with "Add visitor location headers" enabled; staging docroot
   deployed from its own branch whose `.cpanel.yml` targets the staging path (DEPLOY.md).
2. Replace the placeholders in `wrangler.jsonc` with the confirmed staging host and zone, and set `CMS_BASE_URL` /
   `SITE_ORIGIN` to the staging CMS and staging site origins. `npm run check`, then deploy (`wrangler deploy`) only
   with approval.
3. Run `node tools/worker-runtime-smoke.mjs` style checks manually against staging (no mock CMS there): a static
   article (no `X-Velza-Source`), a CMS-only article from HK, IN and PH VPNs (`X-Velza-Region` matches and matches the
   region of a static page in the same session), `?_r=` overrides, a redirect, an unrelated 404, and a non-article
   path (must never reach the Worker: check Workers metrics).
4. Recursion check: one Worker invocation per article request in the Workers metrics/logs.

Tests live in the separate integration kit (`cms_velza_new/integration`, `npm test`).
