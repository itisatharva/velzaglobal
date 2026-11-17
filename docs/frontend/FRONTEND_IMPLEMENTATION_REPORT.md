# Frontend implementation report

Branch `feature/cms-worker-routing-fix` @ `9241703` (uncommitted working tree; nothing staged, committed or pushed).
All measurements are local lab measurements (Chrome, localhost, no throttling) unless stated otherwise.

## Stage 2 — safe frontend fixes (2026-11-17)

### Files changed

| File | Change | Reason |
|---|---|---|
| `shared/css/frontend-fixes.css` (new) | `#smooth-wrapper` pinned up front; `:where(img[width][height]){height:auto}`; `:focus-visible` for the region switcher; styles for `.vg-subscribe-status` and `.vg-cms-message` | CLS fix; image sizing; a11y; status messages. A separate file avoids merge conflicts with `custom.css` (changed on `main`) |
| `shared/js/newsletter-form.js` (new) | Stops native submit of action-less `form.sk__subscribe-form`, clears the field, shows a `role="status"` message | The footer form sent `?the_email=…` into the URL (confirmed) |
| `routing/region-switcher.js` | Builds the switcher on pages without one (single source, same markup as homepages, moves `.sk__mobile-menu-bar` into `.sk__header-actions` like the homepages); click/Escape handling where `custom.js` is absent; arrow/Home/End/Escape/Tab keyboard support; `aria-current` on the active region; equivalent-page navigation with a HEAD check that falls back to the regional homepage on 404 | Switcher missing on inner pages; keyboard access |
| 83 × `regions/**/*.html` (all except `regions/in/luxury-beverage.html`) | `data-velza-region="<r>"` on `<html>` (80 pages; homepages already had it); `<link …frontend-fixes.css?v=20261117>` before `</head>`; `region-switcher.js?v=20261117`; `<script src="/shared/js/newsletter-form.js?v=20261117">`; subscribe form: `aria-label="Email address"`, `aria-label="Subscribe"`, positive `tabindex` removed (172); social links `aria-label="Velza Global on <network> (opens in a new tab)"` (688); back-to-top `aria-label="Back to top"` (56) | See above |
| `regions/in/index.html`, `regions/in/portfolio.html` | Secondary `<h1>` → `<h2>` (2 + 4), same classes — identical to the HK/PH markup of the same sections | One `<h1>` per page |
| 83 × `regions/**/*.html` | `width`/`height` on 493 `<img>` tags; `loading="lazy"` on 59 | Layout stability; deferred off-screen images |
| `cms_velza_new/integration/tests/website-pages.test.mjs` (new) + `package.json` | 7 static checks + 1 TODO over every regional page | Regression guard |

Line endings were preserved per file (70 CRLF, 14 LF; no mixed files after editing).

### How image attributes were chosen (no guessed sizes)

Each of the 83 pages was loaded in Chrome at 1366 × 800 and 390 × 844. For every `<img>`, the natural size was read,
`width`/`height` were set together with the `:where(img[width][height]){height:auto}` rule, and the rendered box was
compared with the original. Attributes were kept only for image sources whose **every visible occurrence rendered
identically (±1px) at both widths**; parallax images were excluded. `loading="lazy"` was kept only for images below
1.2 viewport heights at both widths, not fixed, not parallax, and **not in a Slick carousel** (127 carousel images
were reverted to eager after a test showed horizontally off-screen slides would load late).

Verification: lazy images load while scrolling through ScrollSmoother (11 pages checked, 0 not loaded after the
carousel revert); an aspect-ratio scan of all 83 pages at 1366px and 390px flagged 92 image/width cases whose
rendered ratio differs from the file's ratio — **all 92 render at exactly the same size with and without the new
attributes**, i.e. pre-existing theme sizing (hero banners, parallax backgrounds, cropped cards), not caused by this
change. Horizontal overflow re-checked after the change: 14 pages × 11 widths (320–1920px), 154/154 no overflow.

## Stage 2b — environment-safe CMS configuration

`shared/js/velza-cms/cms-config.js` now selects the CMS origin per hostname (`CMS_ENVIRONMENTS`,
`selectCmsEnvironment()`): only `www.velzaglobal.com` and `staging.velzaglobal.com` can enable the CMS, only with an
`https://` origin, and both are still `null` placeholders. Any other host (including localhost) stays disabled.
See `FRONTEND_CMS_ENVIRONMENT_SETUP.md`. New test in `content-listing.test.mjs`.

## Stage 3 — CMS card design (decision pending)

Previews (mock data, local only; screenshots were local artefacts, removed 2026-11-17):
`cms-cards-option-a-minimal.jpg` (current: image + title) and `cms-cards-option-b-date-excerpt.jpg`
(image + date + title + excerpt). Option B would also require dates/excerpts on the static cards for a consistent
merged listing, and `excerpt`/`summary` added to the listing query fields.

## Test status after Stage 2

`npm test` (integration): 125 tests — **123 pass, 1 fail, 1 todo**. The failure is the backend-owned Worker template
parity check (templates must be regenerated from the updated article pages); the todo is the untouched
`regions/in/luxury-beverage.html`.

### Before / after — CLS (first visit, `Cache-Control: no-store`, 1536 × 639)

| Page | Before | After |
|---|---|---|
| `/` (HK) | 0.017 | 0.017 |
| `/blogs` | 0.592 | 0.014 |
| `/news` | 0.592 | 0.012 |
| `/blogs/global-brand-partnership` | 0.592 | 0.000 |
| `/about-us` (IN) | not measured before | 0.010 |
| `/portfolio` (PH) | not measured before | 0.029 |
| `/blogs/global-brand-partnership` at 375px (iframe) | 1.000 | 0.000 |

With a warm cache the original pages also measured CLS 0 — the shift only happened when the page painted before
ScrollSmoother ran (typical first visit).

LCP (same runs): `/` 4.4–4.5 s (unchanged; LCP element is the hero heading revealed after the theme's 2.4 s curtain
intro, `shared/js/theme.js` `masterCurtainDelay = 2.4`), `/blogs` 0.46 s, `/news` 0.54 s, article 1.4 s.
Shortening the intro is a design decision and was **not** changed.

### Verified behaviour

- Region switcher on inner pages (about, contact, portfolio, blog article; HK/IN/PH): correct region, flag and
  `aria-current`; real mouse click opens the menu; choosing India on a PH article loads the same article for IN;
  switching from a page that does not exist in the target region lands on that region's homepage.
- Keyboard: ArrowDown opens and focuses the first region, arrows wrap, focus outline visible, Escape closes and
  returns focus to the button.
- Mobile off-canvas menu opens/closes at 375px with the CLS fix applied; native scrolling unaffected.
- Newsletter: clicking SUB with a dummy address leaves the URL unchanged and shows the status message.
- Accessibility re-check (home, about, blogs, contact): no unlabelled form fields, no positive tabindex, no duplicate
  ids; cookie banner buttons named.

### Known limitations / pending

- `regions/in/luxury-beverage.html` (owner's uncommitted change) did **not** receive any Stage 2 edit. Apply after
  it is committed: `data-velza-region="in"`, `frontend-fixes.css` link, versioned `region-switcher.js` +
  `newsletter-form.js`, subscribe-form labels/tabindex, social/back-to-top labels, image attributes. Until then the
  page keeps the old behaviour (no switcher; `region-switcher.js` builds nothing without the attribute).
- **Failing test (expected, backend-owned):** `article-renderer.test.mjs` "every template reproduces its live
  reference page byte-for-byte" — the Worker templates in `server/cms/templates/` must be regenerated from the updated
  article pages (`node server/cms/build-templates.mjs`). Not done here: `server/` is backend-owned.
- No-JS visitors: the newsletter guard needs JavaScript; without it the form would still submit to the URL. The
  theme already requires JavaScript to display content.
- Homepage LCP 4.4 s (intro animation) — design decision.
