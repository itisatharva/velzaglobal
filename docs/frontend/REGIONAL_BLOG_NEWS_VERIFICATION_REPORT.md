# Regional Blog & News publishing verification

Date: 2026-11-17 · Fresh verification cycle · All six entries created **manually from scratch** (the Strapi Duplicate
action was **not** used). No application code, backend file or database record was modified by the tester; Strapi
content was changed only through the Content Manager UI. Nothing was committed, staged, pushed or deployed.

## 1. Environment

| Item | Value | Designation |
|---|---|---|
| Website repository | `C:\Users\ADMIN\Desktop\Velza Github\velzaglobal`, branch `feature/cms-worker-routing-fix` @ `9241703` (uncommitted frontend work, 3 stashes untouched) | — |
| CMS repository | `C:\Users\ADMIN\Desktop\cms_velza_new`, branch `feature/cms-p0-routing-security` @ `bf8c2c0` | — |
| CMS | Strapi 5.58.0 `http://127.0.0.1:1338` (`/admin`, `/api`), PostgreSQL `velza_cms2` on :5433 | **Local** |
| Staging CMS | none exists | — |
| Production website | `https://www.velzaglobal.com` — `cms-config.js` `baseUrl: null` (CMS disabled) | **Production, read-only checks only** |
| Local website (owner) | `http://127.0.0.1:8099` (existing server, CMS disabled) | Local |
| Local website (test) | `http://127.0.0.1:8101` — `integration/tools/dev-site-server.mjs` with `DEV_CMS_URL`, region slugs `hk/in/ph`, CMS article pages on (`server/cms` renderer) | Local test rig |
| CMS access from the test site | test-only reverse proxy `http://127.0.0.1:8105` → Strapi, **GET/HEAD only** (POST → 405); needed because Strapi CORS allows only `:8099` | Local test rig |
| Regional routing | Region chosen by `?_r=<hk|in|ph>` (`.htaccess` §9a, reproduced by the dev server), else `CF-IPCountry`, else `hk`. Files: `regions/hk/`, `regions/in/`, `regions/ph/` | — |
| Regional file proof | Listing pages: `<html data-velza-region>` of the **served file** (`hk`/`in`/`ph`). CMS article pages: `og:locale` of the region template (`en_HK`/`en_IN`/`en_PH`) | — |

## 2. Content created (manually) and saved region relations

Saved relations were read from the database **read-only** (`default_transaction_read_only=on`) after saving, and
again after publishing; every draft was reopened with a fresh page load before publishing.

| Entry | Strapi document | Draft row / Published row | Slug | Intended | Saved (draft) | Saved (published) | State now |
|---|---|---|---|---|---|---|---|
| Blog HK | `juotor38cckmnctd1z73qbgu` | 54 / 55 | `qa-regional-blog-hong-kong-2026` | hk | hk | hk | **Unpublished** (workflow test) |
| Blog IN | `ero8gp1rh2bth1oxvg20fj53` | 56 / 57 | `qa-regional-blog-india-2026` | in | in | in | Published |
| Blog PH | `keuiqoye22nmtx2dct7nnzrl` | 58 / 59 | `qa-regional-blog-philippines-2026` | ph | ph | ph | Published |
| News HK | `wksflanftwemww8k2puuk4em` | 30 / 31 | `qa-regional-news-hong-kong-2026` | hk | hk | hk | **Unpublished** (workflow test) |
| News IN | `g2u048pb75plmzwq8ym3lbuz` | 32 / 33 | `qa-regional-news-india-2026` | in | in | in | Published |
| News PH | `g73dviey9k2c68x0pe9woa63` | 34 / 35 | `qa-regional-news-philippines-2026` | ph | ph | ph | Published |

Titles: `QA Regional Blog — Hong Kong — 17 Nov 2026` etc. (exactly as specified). Each entry has a unique
excerpt/summary and body, the QA featured image `qa-test-featured.webp`, publication date 2026-11-17 and SEO title +
description. Public API per region returned exactly the intended slug for each type.

## 3. Publishing results (local test site)

### Listings (top-level page loads, Chrome)

| Listing | Served file | CMS cards shown | Image | Link | Static cards | Duplicates |
|---|---|---|---|---|---|---|
| HK blogs | hk | Blog HK only | loaded (`medium_…webp`) | `/blogs/qa-regional-blog-hong-kong-2026` | 4 (merge mode, by design) | 0 |
| HK news | hk | News HK only | loaded | `/news/qa-regional-news-hong-kong-2026` | 2 | 0 |
| IN blogs | in | Blog IN only | loaded | `/blogs/qa-regional-blog-india-2026` | 4 | 0 |
| IN news | in | News IN only | loaded | `/news/qa-regional-news-india-2026` | 2 | 0 |
| PH blogs | ph | Blog PH only | loaded | `/blogs/qa-regional-blog-philippines-2026` | 4 | 0 |
| PH news | ph | News PH only | loaded | `/news/qa-regional-news-philippines-2026` | 2 | 0 |

Console errors: none. Network: all 6 API requests and 6 image requests returned 200. Static cards remaining next to
CMS cards is the configured `listingMode: 'merge'`, not a fallback (`data-cms-state="cards"`).

### Article pages and cross-region access (HTTP status · region template)

| Article | HK | IN | PH |
|---|---|---|---|
| Blog HK | **200** · en_HK | 404 | 404 |
| Blog IN | 404 | **200** · en_IN | 404 |
| Blog PH | 404 | 404 | **200** · en_PH |
| News HK | **200** · en_HK | 404 | 404 |
| News IN | 404 | **200** · en_IN | 404 |
| News PH | 404 | 404 | **200** · en_PH |

200 pages: correct h1 (upper-case title), the entry's unique body text, featured image loaded, `<title>` from the SEO
title. 404 responses are real HTTP 404s with the site's own "404 – Page Not Found" page (no stale content).

### Draft / publish workflow (Blog HK and News HK)

| Step | Blog HK | News HK |
|---|---|---|
| Draft not public (API total 0, URL 404) | PASS | PASS |
| Publish → appears in HK only | PASS | PASS |
| Edit SEO title + **Save** → status "Modified", live page unchanged | PASS (title stayed "QA Regional Blog HK") | PASS |
| Republish → update live | PASS ("QA Regional Blog HK EDITED") | PASS ("QA Regional News HK EDITED") |
| Unpublish → removed from listing and article URL | PASS (listing `keep-static`; 404 in HK/IN/PH) | PASS |

## 4. Test matrix

| Entry | CMS saved region | Published | Correct listing | Correct article route | Wrong-region listing | Wrong-region direct access | Result |
|---|---|---|---|---|---|---|---|
| Blog HK | hk | yes | shown in HK | 200 | not shown (IN, PH) | 404 / 404 | **PASS** |
| Blog IN | in | yes | shown in IN | 200 | not shown (HK, PH) | 404 / 404 | **PASS** |
| Blog PH | ph | yes | shown in PH | 200 | not shown (HK, IN) | 404 / 404 | **PASS** |
| News HK | hk | yes | shown in HK | 200 | not shown (IN, PH) | 404 / 404 | **PASS** |
| News IN | in | yes | shown in IN | 200 | not shown (HK, PH) | 404 / 404 | **PASS** |
| News PH | ph | yes | shown in PH | 200 | not shown (HK, IN) | 404 / 404 | **PASS** |
| Staging CMS | — | — | — | — | — | — | **BLOCKED** (no staging) |
| Production CMS | — | — | — | — | — | — | **BLOCKED** (CMS disabled) |

## 5. Live website (production, read-only)

| Check | Result |
|---|---|
| CMS on production | Disabled (`baseUrl: null`) — **CMS publishing cannot be verified against production** |
| `/blogs` with `?_r=hk/in/ph` | 200, served regional file hk/in/ph, 4 static cards each |
| `/news` with `?_r=hk/in/ph` | 200, served regional file hk/in/ph, 6 static cards each |
| Static articles (`/blogs/global-brand-partnership`, `/news/tonino-lamborghini-velza-global-partnership-philippines`) | 200 |
| QA slug on production (`/blogs/qa-regional-blog-hong-kong-2026`) | 404 — no QA content reached production |

## 6. Issues

| # | Issue | Status / evidence |
|---|---|---|
| 1 | Strapi Duplicate drops inherited region relations (found in the previous cycle) | **Not re-tested** — Duplicate was deliberately not used. Manual creation saved all regions correctly (6/6). Remains open for the backend (handoff #14a). |
| 2 | Incorrect saved region | None (6/6 correct in draft and published rows) |
| 3 | API errors | None (all 200) |
| 4 | Missing images | None |
| 5 | Incorrect links | None |
| 6 | Regional routing failures | None |
| 7 | Worker / CMS article pages | No errors. Known limitation: the article templates are stale (missing the new region attribute, switcher, CLS fix, newsletter guard) until the backend regenerates them (handoff #8). |
| 8 | Tooling | Chrome automation could not capture screenshots on one admin tab (CDP timeout); a fresh tab worked. Not a product defect. |

## 7. Evidence

`cms_velza_new/integration/qa-artifacts/regional-blog-news-verification/`:
`01–06-*-saved-form-region-*.jpg` (saved region per entry), `07-strapi-blog-list-published-entries.jpg`,
`08–13-listing-*-pass.jpg` (six regional listings), `14-detail-news-ph-200-pass.jpg`,
`15-cross-region-news-ph-on-hk-404-pass.jpg`. Status codes, DB rows and API results are recorded in this report.
(The screenshot folder was a local, untracked artefact and was removed on request on 2026-11-17; the results above
are the record.)

## 8. Cleanup (nothing deleted)

| Record | Current state |
|---|---|
| Blog `qa-regional-blog-hong-kong-2026`, News `qa-regional-news-hong-kong-2026` | Draft (unpublished) |
| Blog IN, Blog PH, News IN, News PH (`qa-regional-*-india-2026`, `qa-regional-*-philippines-2026`) | **Published in the local CMS only** — left published for review; unpublish/delete on request |
| Earlier cycle: `qa-test-blog-hk-only`, `qa-test-blog-in-only`, `qa-test-blog-ph-only`, `qa-test-blog-all-regions`, `qa-test-news-hk-ph` | Draft |
| Media `qa-test-featured.webp` (+ large/medium/small/thumbnail formats) | In the local media library |
| Owner drafts (`test-premium-beverage`, `test-cms-integration`) | Untouched |

## 9. Final decision

| # | Area | Decision |
|---|---|---|
| 1 | Local CMS regional publishing | **PASS** — 6/6 entries saved with the intended region, published, listed and routed correctly |
| 2 | Staging CMS regional publishing | **BLOCKED** — no staging CMS exists |
| 3 | Live website regional reflection | **BLOCKED** for CMS content (production CMS disabled); static regional pages **PASS** |
| 4 | Cross-region isolation | **PASS** (local) — 18/18 article route checks and 6/6 listings as expected |
| 5 | Overall CMS regional publishing readiness | **Not ready for production** — functionally correct locally; requires a hosted staging CMS, CORS, Worker template regeneration and deployment, the Duplicate-relation fix (or editor guidance), and a staging repeat of this cycle |
