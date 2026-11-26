# Frontend QA test matrix

Date: 2026-11-17. Browser: **Google Chrome (desktop, Windows) via automation only.** "Local" = this branch's working
tree served on localhost; "Live" = `https://www.velzaglobal.com` (current production code, read-only checks).
Status: PASS · FAIL · BLOCKED · NOT TESTED · N/A.

## 1. Automated tests (`cms_velza_new/integration`, `npm test`)

| Total | Pass | Fail | Skipped | Todo |
|---|---|---|---|---|
| 125 | 123 | 1 | 0 | 1 |

- **Fail:** `article-renderer.test.mjs` — "every template reproduces its live reference page byte-for-byte outside the
  CMS markers". Expected: the static article pages were updated; the backend-owned Worker templates must be
  regenerated (handoff #8). Not weakened.
- **Todo:** `website-pages.test.mjs` — `regions/in/luxury-beverage.html` intentionally untouched (owner's uncommitted change).
- New/updated coverage: stalled-body timeout, query field overrides, listing query, intrinsic image size, per-host CMS
  environment selection (https-only, unknown hosts disabled), region attribute on every page, fixes stylesheet,
  versioned switcher + newsletter guard, accessible subscribe form, one `<h1>` per page, consistent cache versions.
- Not automated (no DOM library in the dependency-free suite): region-switcher behaviour and newsletter guard —
  verified in Chrome instead (below).

## 2. Local — functional (Chrome)

| Area | Check | Status |
|---|---|---|
| Region switcher | Present with correct region/flag on inner pages (about, contact, portfolio, blog article) HK/IN/PH | PASS |
| Region switcher | Mouse: open menu, choose India on a PH article → same article in IN | PASS |
| Region switcher | Missing page in target region → regional homepage | PASS |
| Region switcher | Keyboard: ArrowDown opens + focuses, arrows wrap, visible focus, Escape closes + returns focus | PASS |
| Mobile menu | Off-canvas menu open/close at 375px with CLS fix | PASS |
| Newsletter | Submit → URL unchanged, status message, field cleared | PASS |
| Lazy images | Load while scrolling through ScrollSmoother (11 pages) | PASS (after carousel revert) |
| Image sizing | 92 flagged ratio mismatches all identical with/without new attributes (pre-existing theme sizing) | PASS |
| CMS listing | Merge, regional filtering, linking, fallback (mock CMS + local Strapi) | PASS |
| CMS article | Title, body, image, date, SEO/OG/JSON-LD, related, 404 for other regions/unknown slugs | PASS |
| CMS portal | Full workflow — see `CMS_LIVE_TESTING_REPORT.md` | PASS (1 CMS defect, 1 BLOCKED) |
| Accessibility | No unlabelled fields, no positive tabindex, no duplicate ids, named social/back-to-top links, cookie buttons named (home, about, blogs, contact) | PASS |
| Accessibility | Colour contrast, screen-reader pass | NOT TESTED |

## 3. Local — responsive (horizontal overflow)

14 pages (3 homepages, about, blogs, news, contact, portfolio, blog article, news article, coffee-collection,
rosso-caffe, luxury-beverage HK, 404 IN) × 11 widths (320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440, 1920):
**154/154 PASS** after all changes. Method: same-origin iframes at exact widths (media queries apply).

## 4. Local — performance (lab, Chrome, localhost, no throttling; first visit with `Cache-Control: no-store`)

| Page | CLS before | CLS after | LCP after |
|---|---|---|---|
| `/` | 0.017 | 0.017 | 4.4–4.5 s (intro animation, unchanged by decision) |
| `/blogs` | 0.592 | 0.014 | 0.46 s |
| `/news` | 0.592 | 0.012 | 0.54 s |
| blog article | 0.592 | 0.000 | 1.4 s |
| `/about-us` (IN) | — | 0.010 | 0.64 s |
| `/portfolio` (PH) | — | 0.029 | 0.54 s |
| blog article @375px | 1.000 | 0.000 | — |

No Lighthouse run (not installed); INP not measured. Numbers are not production field data.

## 5. Live website (`https://www.velzaglobal.com`, read-only, no forms submitted, no consent clicked)

| Check | Result | Status |
|---|---|---|
| Homepage per region (`?_r=hk|in|ph`) | Correct `data-velza-region` and switcher label each; geolocation served IN for this tester | PASS |
| Inner pages | No switcher, no `data-velza-region`, `VelzaRegion.get()` = `hk` on an IN-served `/blogs` | FAIL (fixed locally, not deployed) |
| CMS on production | `content-listing.js` loads, `cms-disabled`, static cards shown | PASS (fallback) — **no live CMS** |
| Console / network (`/blogs`) | No console errors; all requests 200/204 | PASS |
| Unknown script | `/.webmcp/bridge.js` injected by Cloudflare edge on every page, not in repo | Reported (handoff #13) |
| Responsive overflow | `/`, about, blogs, news, contact, portfolio × 10 widths: 60/60 no overflow | PASS |
| IN homepage headings | 3 × `<h1>` | FAIL (fixed locally, not deployed) |
| Newsletter | Same code as local before the fix → address goes into the URL on submit | FAIL by code inspection + local test (not submitted on production) |

## 6. Cross-browser / devices

| Browser / device | Status |
|---|---|
| Chrome (Windows desktop) | PASS (all above) |
| Edge | NOT TESTED (no automation available) |
| Firefox | NOT TESTED |
| Safari / iOS Safari | NOT TESTED |
| Android phone, iPhone, tablet (physical) | NOT TESTED — mobile widths emulated in Chrome only |
