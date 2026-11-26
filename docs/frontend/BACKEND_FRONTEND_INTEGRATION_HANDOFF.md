# Backend / DevOps ← Frontend integration handoff

Audience: the backend/DevOps owner of Strapi, hosting, Cloudflare and the article Worker.
Only **remaining backend-owned requirements** are listed. No credentials are included here — share staging access
through the approved secure channel only.

## Already done on the frontend (no backend action)

- Browser CMS client: GET-only, no token, timeout covers headers **and** body, request fields limited for listings
  (`fields[]=title,slug,publicationDate` + `populate[featuredImage]`), static fallback on any error.
- Per-host CMS configuration (`shared/js/velza-cms/cms-config.js`): only `www.velzaglobal.com` and
  `staging.velzaglobal.com` can enable the CMS, **https origins only**; both are `null` placeholders today.
- Region switcher on all pages, CLS fix, image sizing/lazy loading, newsletter guard, a11y fixes — see
  `FRONTEND_IMPLEMENTATION_REPORT.md`.

## Required from backend / DevOps

| # | Requirement | Detail | Blocks |
|---|---|---|---|
| 1 | **Hosted staging CMS URL** | https origin, e.g. `https://cms-staging.<domain>` (not decided). Frontend sets it in `CMS_ENVIRONMENTS['staging.velzaglobal.com'].baseUrl` | Staging test of the live integration |
| 2 | **Production CMS URL** | https origin for `CMS_ENVIRONMENTS['www.velzaglobal.com'].baseUrl`; optional separate media origin (`mediaBaseUrl`) | Go-live |
| 3 | **CORS origins** | Staging CMS: `https://staging.velzaglobal.com`. Production CMS: `https://www.velzaglobal.com`. Exact origins, GET/HEAD/OPTIONS, header `Accept`, no credentials (matches current `config/middlewares.ts` design) | 1, 2 |
| 4 | **Published staging test data** | Blog + News, each: HK-only, IN-only, PH-only, all-regions, one with no gallery, one draft. Slugs per rule in #6. See `FRONTEND_CMS_ENVIRONMENT_SETUP.md` §6 | Staging QA |
| 5 | **Public API permissions** | Keep Public `find` on Blog, News Article, Region only. Author/Category bylines are **not** shown by the frontend — only grant `find` on them if bylines are approved later | — |
| 6 | **Slug validation** | Website routes accept only `^[a-z0-9]+(-[a-z0-9]+)*$`; Strapi uid currently allows `A-Za-z0-9-_.~`. Add the regex (or a lifecycle check) so editors cannot publish an entry whose URL 404s | Go-live |
| 7 | **Media** | Absolute `https://` URLs (or relative `/uploads/…` served over https from the CMS/media origin); keep responsive formats enabled — the listing uses `formats.medium` and its `width`/`height` | Go-live |
| 8 | **Worker templates out of sync** | Static article pages changed (region attribute, `frontend-fixes.css`, versioned `region-switcher.js`, newsletter guard, a11y labels, image sizes). Regenerate with `node server/cms/build-templates.mjs` on this branch after rebasing onto `main`, then run `npm test` in `cms_velza_new/integration` — the failing test "every template reproduces its live reference page byte-for-byte" must pass. Worker deployment remains yours | CMS-only article pages |
| 9 | **Production CSP headers** | Allow at least: self; `cdnjs.cloudflare.com` (flag-icons CSS), `unpkg.com` (leaflet), Google Fonts, GTM/GA (`www.googletagmanager.com`, `www.google-analytics.com`), Cloudflare Insights, the CMS origin (`connect-src`, `img-src`), and the `.webmcp` bridge if it stays (#13). Theme uses inline `<script>` (consent defaults) → needs a nonce/hash strategy | Hardening |
| 10 | **Cache rules** | HTML: keep bypass/short TTL (CMS listings are client-side; CMS article HTML is `private, no-cache`). `/shared/` JS/CSS: 1-year cache is fine **because** the frontend versions every changed asset with `?v=` — keep query strings in the cache key. CMS `/api/*`: short edge TTL (e.g. 60 s) + purge on publish/unpublish webhook | Performance |
| 11 | **API response contract** | Strapi 5 flat entries; fields used: `title`, `slug`, `publicationDate`, `featuredImage{url,alternativeText,width,height,formats.medium}`, `regions[].slug` (detail pages also `excerpt`/`summary`, `content` blocks, `gallery`, `faqs`, `seo.*`, `sourceName/sourceUrl`, `publishedAt`, `updatedAt`). Errors in `{error:{message}}`. `pagination.pageSize` ≤ 100. Draft data must never be returned to the Public role (already enforced by `published-only` middleware) | Go-live |
| 12 | **Staging access** | A Content Manager **test account** (not Super Admin) for portal workflow and permission tests — via the secure channel | Permission tests (currently BLOCKED) |
| 13 | **Live site: unknown edge script** | Every live page loads `https://www.velzaglobal.com/.webmcp/bridge.js` (module, in `<head>`), served by Cloudflare (cache HIT) and **not present in the repository**. Confirm it is an intentional Cloudflare feature; otherwise remove it | Security review |
| 14 | **Strapi editor issues found in portal testing** | (a) *Duplicate* drops relations inherited from the source when new ones are added — a duplicated article silently lost its Philippines region; (b) Publish is a no-op in the clone view until saved; (c) slug pre-filled with "blog"; (d) date defaults to 00:00 editor-local time; (e) raw field names without descriptions; (f) region picker allows "Create a relation". Details: `CMS_LIVE_TESTING_REPORT.md`. Upgrade to Strapi 5.62 is already planned (audit) — re-test (a)/(b) after it | Editor safety |
| 15 | `.htaccess` / routing | No change requested. Region persistence stays "one page view" (business decision 2026-11-17) | — |

## Frontend actions waiting on these

1. On #1/#3: set the staging `baseUrl`, bump `?v=` in 8 places, deploy to staging, run the QA matrix with #4.
2. On #8 (after regeneration): run the full test suite and spot-check a CMS article page at 375px and 1366px.
3. On #12: run the Content Manager permission tests.
