# Frontend next-phase audit

Date: 2026-11-17 · Scope: website frontend and its CMS-facing integration · Phase 1 (inspection only — no source
file was changed while producing this document).

Location note: `docs/` is in the website repository. `.cpanel.yml` excludes `*.md` from deployment and `.htaccess`
§11 denies `.md`, so these documents never reach production (rsync may create an empty `docs/frontend/` folder).

## 1. Repository state (verified, not assumed)

| | Website (`velzaglobal`) | CMS workspace (`cms_velza_new`) |
|---|---|---|
| Branch | `feature/cms-worker-routing-fix` (no upstream; never pushed) | `feature/cms-p0-routing-security` (tracks origin) |
| HEAD | `9241703` | `bf8c2c0` |
| Behind `main` | 4 commits (`main` = `a8f1fa4`, 4 news articles) | 0 |
| Staged | none | none |
| Stashes | 3 — `stash@{0}` diagnose/philippines-region-selector, `stash@{1}` feature/darkstar-animation-layer, `stash@{2}` feature/product-verification | none |
| Pre-existing user change (do not touch) | `regions/in/luxury-beverage.html` | — |
| Untracked | — | `.claude/settings.json` (keep) |

Modified by the previous frontend pass (intact, verified):

| File | Change |
|---|---|
| `shared/js/velza-cms/velza-cms-client.js` | timeout covers the response body; `fields` / `populate` overrides (byte-identical to `integration/velza-cms-client.js`, parity test passes) |
| `shared/js/velza-cms/content-listing.js` | lightweight listing query (`LISTING_QUERY`); intrinsic image size, `decoding="async"`; versioned imports `?v=20261117` |
| `regions/{hk,in,ph}/{blogs,news}.html` | `content-listing.js?v=20261117` (one line each) |
| `integration/velza-cms-client.js`, `integration/tests/client.test.mjs`, `integration/tests/content-listing.test.mjs` | same client change; +6 tests, one expectation extended |

Automated tests: `npm test` in `integration` → **116 / 116 pass, 0 skipped** (2026-11-17).

Running services (not started by this work): Strapi `127.0.0.1:1338` (local, development), PostgreSQL `:5433`,
an existing website dev server on `127.0.0.1:8099` (PID 14012, CMS disabled — `baseUrl: null`).

## 2. Current implementation vs previous audit

| # | Area | Finding | Status |
|---|---|---|---|
| 1 | CMS client and config | Client as described; `cms-config.js` single file, `baseUrl: null`, `regionSlugs {hk,ph,in}`, `listingMode 'merge'`, `detailPages false`, `fallbackToStatic true` | Unchanged |
| 2 | Listings | `[data-cms=blog-list|news-list]` on 6 pages; merge mode; links only to known pages | Complete (mock-verified) |
| 3 | Region filtering | `filters[regions][slug][$eq]`; local Strapi returns 200 for all client query shapes | Complete |
| 4 | Static fallback | keep-static on disabled / error / empty / timeout | Complete |
| 5 | Loading / error / empty | `aria-busy`, `role=status` message; messages unstyled; shown only when `fallbackToStatic:false` | Partial |
| 6 | Article routes | Static files win; CMS-only articles need the backend-owned Worker (`server/`), not deployed; templates stale vs `main` | Blocked (backend) |
| 7 | Region switcher | Markup + `data-velza-region` exist **only on `regions/*/index.html`**. 25 other pages per region load `region-config.js` + `region-switcher.js` but have no menu; `VelzaRegion.get()` returns `hk` there. Open/close + `aria-expanded` + Escape handled in `shared/js/custom.js:16-41`; no arrow-key or focus management | Broken on inner pages |
| 8 | Region model | **Deliberate**: "the visitor's choice lasts exactly one page view" (`routing/region-switcher.js:5-22`). `?_r` is stripped after load; the next link falls back to `CF-IPCountry` | Business decision needed to change |
| 9 | Shared header | Header is duplicated per page (no include system). Homepage wraps the switcher in `.sk__header-actions`; inner pages have only `.sk__mobile-menu-bar`. Switcher CSS is shared (`custom.css`, `responsive-fix.css`); the **flag-icons stylesheet (cdnjs, no SRI) is loaded only on the 3 homepages** | — |
| 10 | Page parity | All 3 regions have the same 28 HTML files on this branch → an equivalent page always exists | — |
| 11 | Cache busting | `?v=20261117` in 8 places (2 imports + 6 script tags) | Complete |
| 12 | SEO | Unique titles, descriptions and canonicals on all 60 indexable pages; JSON-LD everywhere except `coming-soon`; `in/index.html` 3× `<h1>`, `in/portfolio.html` 5× `<h1>`; no hreflang; `og:locale en_HK` everywhere | Mostly complete |
| 13 | Images | 586 `<img>` without width/height; 532 without `loading`; 0 without `alt` | Open |
| 14 | Responsive | 14 pages × 11 widths (320–1920): no horizontal overflow | Complete (Chrome) |
| 15 | CLS | 0.592 on `/blogs` and articles (lab). Single shift ~370 ms: `#smooth-wrapper.pushable-content` goes 0 → viewport height, hero text moves ~90 px. `#smooth-wrapper` is GSAP **ScrollSmoother's** wrapper, created in `shared/js/theme.js:32` (`ScrollSmoother.create({smooth:0, effects:true})`), which pins it `position:fixed` at runtime. Homepage CLS 0.017 (curtain intro) | Open — root cause to confirm experimentally |
| 16 | Newsletter form | 72 footer `form.sk__subscribe-form` have no `action`, no `id`; `shared/js/form.js` expects `#sk__subscribe-form-1` and is not loaded → native **GET submit to the current URL puts `?the_email=…` in the address bar, server logs and analytics `page_location`**. Input has no `<label>`; positive `tabindex="1"/"2"` | **Defect (privacy + a11y) — confirmed in Chrome on the local dev server: submitting with a dummy address loaded `/blogs?the_email=leak-test%40example.invalid`** |
| 17 | Deployment | `.cpanel.yml` rsyncs the checked-out branch to production; no build step; `docs/` and `*.md` excluded | Unchanged |

## 3. Regression risks

- The header is duplicated on ~84 page files (28 × 3); any header change must be applied consistently. Mitigation: generate the switcher markup from `region-switcher.js` (one source) and only add a static attribute per page.
- `#smooth-wrapper` is used by GSAP ScrollSmoother, the off-canvas menu (`pushContent`) and parallax effects; a CSS fix must be tested with the mobile menu open/close and scroll effects.
- This branch is 4 commits behind `main`; every page edit adds merge surface. The 4 `main` commits touch `regions/*/news.html`, new `regions/*/news/*.html`, `shared/css/custom.css`, `sitemap.xml`, `llms.txt`, `DEPLOY.md`. Editing `custom.css` or `news.html` here increases conflict risk.
- `/shared/` assets are cached for one year: any CSS/JS change must use a new `?v=` on the referencing tags, or returning visitors keep the old file.

## 4. Backend / business dependencies

| Item | Owner |
|---|---|
| Hosted staging and production CMS URLs (https), CORS origins | Backend/DevOps |
| Staging CMS with authorised Content Manager test account; published HK/IN/PH test content | Backend/DevOps |
| Worker deployment and template regeneration | Backend/DevOps |
| Region persistence model (URL / cookie / geolocation-only) | **Business decision** (cookie option also needs `.htaccess` → DevOps) |
| CMS card design (minimal vs date + excerpt) | **Business decision** |
| Newsletter: real subscription endpoint, or disable the form | **Business decision** (+ backend if a real endpoint) |
| Regional SEO (hreflang / canonical / og:locale) | Business decision (F4b/F4c) |
| CMS portal testing environment: local Strapi is the only CMS available — no staging CMS; only one admin user (Super Admin) exists, no Content Manager user | Backend + your approval |

## 5. Files proposed for modification (Stage 2–3)

| File(s) | Proposed change | Risk |
|---|---|---|
| `routing/region-switcher.js` | Build the switcher UI when a page has none (single source); keyboard support (arrow keys, focus return); keep "equivalent page" navigation via `?_r` | Low–medium |
| `regions/*/*.html`, `regions/*/{blogs,news}/*.html` (except `in/luxury-beverage.html`, see below) | Add `data-velza-region="<r>"` to `<html>`; bump `?v` on `region-switcher.js` | Low (attribute only) |
| `shared/css/custom.css` or a new small `shared/css/region-switcher.css` | Inner-page placement of the switcher; flag fallback | Low; new file avoids `custom.css` merge conflicts |
| `shared/js/theme.js` or CSS | CLS fix for `#smooth-wrapper` — only after experiment confirms it | Medium |
| `regions/in/index.html`, `regions/in/portfolio.html` | One `<h1>` per page | Low |
| Static `<img>` across pages | `width`/`height` from real file dimensions; `loading="lazy"` below the fold only | Medium (volume) |
| Footer subscribe form | Stop the GET leak; label; remove positive tabindex | Low — behaviour decision needed |
| `shared/js/velza-cms/cms-config.js` | Environment-safe configuration (no invented URLs) | Low |

**Conflict:** `regions/in/luxury-beverage.html` carries your uncommitted change. It needs the same attribute/version
edits as the other pages; it will be **left untouched** and listed as an outstanding item unless you approve editing it.

## 6. Decisions (answered 2026-11-17)

| # | Question | Decision |
|---|---|---|
| 1 | Region persistence | **Keep the current one-page-view model.** Fix the switcher on inner pages only; no routing/SEO change. |
| 2 | CMS card design | **Keep minimal (image + title)** — decided after previews (Stage 3). |
| 6 | Worker template regeneration | **Backend colleague** regenerates `server/cms/templates` (handoff). |
| 7 | Homepage intro animation (LCP ~4.4 s) | **Keep as is.** |
| 3 | Newsletter form | **Block the URL submission in JS and show an inline message**; add an accessible label; remove positive tabindex. |
| 4 | CMS portal tests | **Local Strapi**, disposable "QA TEST" entries; the owner logs in to the admin personally; entries unpublished at the end, deleted only with approval. |
| 5 | `regions/in/luxury-beverage.html` | **Do not touch.** Pending edits for that page are listed in the implementation report. |
