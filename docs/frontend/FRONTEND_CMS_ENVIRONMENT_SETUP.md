# Frontend CMS environment setup

How the website's browser code finds the Strapi CMS in each environment, and what the backend team must provide.
No hosted CMS URL exists yet; every hosted value below is a **placeholder**. Live CMS integration is **not**
complete until a real hosted endpoint has been tested.

## 1. How the website chooses the CMS

File: `shared/js/velza-cms/cms-config.js` (public — never put a token, password or private URL in it).

| Website host | CMS origin (`baseUrl`) | Status |
|---|---|---|
| `www.velzaglobal.com` (production) | `CMS_ENVIRONMENTS['www.velzaglobal.com'].baseUrl` | **PLACEHOLDER (`null`) — CMS disabled** |
| `staging.velzaglobal.com` (staging, DEPLOY.md) | `CMS_ENVIRONMENTS['staging.velzaglobal.com'].baseUrl` | **PLACEHOLDER (`null`) — CMS disabled** |
| any other host (localhost, previews, unknown) | always `null` | CMS disabled by design |

Rules enforced by `selectCmsEnvironment()` (tested in `integration/tests/content-listing.test.mjs`):

- Only listed hosts can enable the CMS; the hostname match is case-insensitive.
- The origin must be `https://host[:port]` — plain http, paths or anything else is refused (CMS stays disabled).
- `mediaBaseUrl` is optional (also https only); it defaults to `baseUrl`.
- With `baseUrl` null, or on any CMS error, the static cards stay (`fallbackToStatic: true`).

## 2. Local development (no file edits)

| Item | Value |
|---|---|
| Local Strapi admin / API | `http://127.0.0.1:1338/admin`, `http://127.0.0.1:1338/api` |
| Local website | `integration/tools/dev-site-server.mjs` (default port 8099; serves this repository's checked-out branch) |
| Enable the CMS locally | `DEV_CMS_URL=http://127.0.0.1:1338 DEV_CMS_REGION_HK=hk DEV_CMS_REGION_IN=in DEV_CMS_REGION_PH=ph node tools/dev-site-server.mjs` (localhost only; the server serves an in-memory `cms-config.js`) |
| CMS article pages locally | add `DEV_CMS_DETAIL=true` (uses `server/cms` renderer) |
| Mock CMS (no Strapi needed) | `node tools/mock-cms-server.mjs` (port 1398) |

The local Strapi only allows the browser origins in its `CORS_ORIGINS` (`http://127.0.0.1:8099`, `http://localhost:8099`).
A dev site on another port needs a matching CORS entry (backend-owned) — the frontend never works around CORS.

## 3. Regions

`regionSlugs: { hk: 'hk', ph: 'ph', in: 'in' }` — matches the Region entries that exist in the local CMS database.
Business sign-off on region codes (F6a) is still pending; a `null` entry would keep that region static.

## 4. Going live — exact steps (frontend side)

1. Backend provides the staging CMS origin (https) and confirms CORS for `https://staging.velzaglobal.com`.
2. Set `CMS_ENVIRONMENTS['staging.velzaglobal.com'].baseUrl` (and `mediaBaseUrl` if media is on another origin).
3. **Bump the cache version** in all 8 places to the same new value (e.g. `20261201`):
   - `shared/js/velza-cms/content-listing.js`: the two `import … from './…js?v=…'` lines;
   - `regions/{hk,in,ph}/{blogs,news}.html`: `<script type="module" src="/shared/js/velza-cms/content-listing.js?v=…">`.
   `integration/tests/website-pages.test.mjs` fails if these versions differ.
4. Deploy to staging, then verify with the staging test content (section 6) and the QA matrix.
5. Repeat 1–4 for production (`www.velzaglobal.com`) only after staging sign-off.

## 5. Expected CORS origins (backend `CORS_ORIGINS`)

| CMS | Origins |
|---|---|
| Staging CMS | `https://staging.velzaglobal.com` |
| Production CMS | `https://www.velzaglobal.com` |
| Local CMS | `http://127.0.0.1:8099`, `http://localhost:8099` (already configured) |

Exact origins only (no `*`, no paths). Requests are `GET` with `Accept: application/json`; no credentials, no token.

## 6. Published test content needed on staging

At least, per type (Blog and News Article):

| Entry | Regions | Purpose |
|---|---|---|
| QA HK only | hk | regional isolation |
| QA IN only | in | regional isolation |
| QA PH only | ph | regional isolation |
| QA all regions | hk, in, ph | multi-region |
| QA no image | hk | placeholder image |
| QA draft | hk (never published) | must not appear |

Each published entry needs: title, slug matching `^[a-z0-9]+(-[a-z0-9]+)*$`, excerpt/summary, body, featured image
(with responsive formats), publication date, regions, SEO meta title/description.

## 7. Backend dependencies (summary)

Hosted staging and production CMS URLs (https); CORS origins above; published staging test data; Public role
`find` on Blog/News/Region (and Author/Category only if bylines are approved); slug validation; https media URLs
with responsive formats; Worker template regeneration and deployment. Details:
`BACKEND_FRONTEND_INTEGRATION_HANDOFF.md`.
