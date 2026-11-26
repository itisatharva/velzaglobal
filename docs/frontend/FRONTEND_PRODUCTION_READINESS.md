# Frontend production readiness

Date: 2026-11-17 · Branch `feature/cms-worker-routing-fix` (uncommitted; 4 commits behind `main`).
Legend: **PASS** verified · **FAIL** tested and failed · **BLOCKED** waiting for backend/business input ·
**NOT TESTED** environment/device unavailable · **N/A**.

## Readiness by layer (reported separately on purpose)

| Layer | Status | Why |
|---|---|---|
| 1. Frontend implementation | **PASS with known limitations** | Fixes implemented and verified locally; 123/125 tests pass (1 backend-owned failure, 1 intentional todo) |
| 2. Frontend staging readiness | **BLOCKED** | No staging CMS URL/CORS; branch not rebased/merged; Worker templates not regenerated; Edge/Firefox/Safari/devices not tested |
| 3. Live website verification | **PASS (read-only)** | Live site works, no console errors, no overflow; current production still has the inner-page switcher bug, 3 `<h1>` on IN home and the newsletter URL leak — fixed only locally |
| 4. Live CMS integration | **BLOCKED** | No hosted CMS exists; production has the CMS disabled. Only local Strapi was tested |
| 5. Backend/DevOps production readiness | **Not assessed here** | See the system audit and `BACKEND_FRONTEND_INTEGRATION_HANDOFF.md` |

## Item checklist

| Item | Status | Evidence |
|---|---|---|
| Existing architecture preserved (static HTML, `.htaccess`, cPanel) | PASS | No framework/build change; no routing change |
| Region switcher on homepages and inner pages | PASS (local) | QA matrix §2 |
| Region persistence model | N/A | Business decision: keep one page view |
| CMS configuration environment-safe | PASS | `selectCmsEnvironment` tests; https-only; unknown hosts disabled |
| Blog/News listings, fallback, regional filtering | PASS (local) | Mock + local Strapi |
| CMS errors do not break the site | PASS | Fallback tests; timeout covers body |
| CMS article pages (Worker) | BLOCKED | Templates stale; deployment backend-owned |
| CLS corrected and measured | PASS (lab) | 0.592 → ≤ 0.029 |
| Homepage LCP < 2.5 s | FAIL (accepted) | 4.4 s due to intro animation — business decided to keep it |
| Images: dimensions/lazy without distortion | PASS | Browser-measured; 92/92 flags pre-existing |
| Heading structure (one `<h1>`) | PASS (local) | Static test over all pages |
| Accessibility (automated checks) | PASS | Labels, tabindex, names, ids |
| Accessibility (contrast, screen reader) | NOT TESTED | — |
| Responsive (320–1920) | PASS | 154/154 local, 60/60 live |
| Automated tests | FAIL (1, backend-owned) | Worker template parity |
| CMS portal workflow (local) | PASS | `CMS_LIVE_TESTING_REPORT.md` |
| CMS portal workflow (staging) | BLOCKED | No staging CMS |
| Content Manager permissions | BLOCKED | No Content Manager test account |
| Regional isolation | PASS (local) | Single and multi-region entries |
| Cross-browser (Edge, Firefox, Safari) / physical devices | NOT TESTED | Chrome only |
| `regions/in/luxury-beverage.html` fixes | BLOCKED | Owner's uncommitted change; apply after commit |
| Newsletter subscriptions | N/A (blocked by design) | Guard shows "opening soon" until a backend endpoint exists |

## Files changed (website repository, uncommitted)

New: `shared/css/frontend-fixes.css`, `shared/js/newsletter-form.js`, `docs/frontend/*.md`.
Modified: `routing/region-switcher.js`, `shared/js/velza-cms/{cms-config,content-listing,velza-cms-client}.js`,
83 × `regions/**/*.html` (all except `regions/in/luxury-beverage.html`; that file still carries only the owner's change).
CMS workspace (uncommitted): `integration/velza-cms-client.js`, `integration/package.json`,
`integration/tests/{client,content-listing}.test.mjs`, new `integration/tests/website-pages.test.mjs`,
local QA screenshots (removed 2026-11-17, not committed).

Reasons per change: `FRONTEND_IMPLEMENTATION_REPORT.md`. Screenshots were local artefacts and have been removed.

## Known limitations

- Measurements are local lab values, not field data; no Lighthouse/INP.
- Region switcher and newsletter guard are verified in Chrome but not covered by automated DOM tests.
- No-JS visitors: newsletter guard needs JavaScript (the theme already requires JS to show content).
- The branch is 4 commits behind `main` (4 news articles, `custom.css`, `sitemap.xml`, `llms.txt`, `DEPLOY.md`).
  The 4 new news pages on `main` do not yet have these fixes.

## Exact next actions

1. **Owner:** commit `regions/in/luxury-beverage.html`; then apply the pending edits to it (listed in the implementation report).
2. **Owner (approval):** rebase this branch onto `main`; apply the same page-level fixes to the 4 new news pages
   (re-run the image scan for them); re-run `npm test` and the QA matrix.
3. **Backend:** regenerate Worker templates (handoff #8); provide staging CMS URL + CORS + test data + Content Manager
   test account (#1, #3, #4, #12); confirm the `.webmcp` script (#13).
4. **Frontend:** set staging `baseUrl`, bump `?v=` in 8 places, deploy to staging; run portal + live-CMS tests on staging;
   test Edge, Firefox, Safari and real phones.
5. **Owner:** commit (and push) the frontend work in reviewable commits once satisfied; production deploy only from
   `main` via the existing cPanel process.
