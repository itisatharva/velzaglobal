# CMS portal and integration testing report

Date: 2026-11-17 · Environment: **local only** — Strapi 5.58.0 at `http://127.0.0.1:1338` (database `velza_cms2`),
website working tree served by `integration/tools/dev-site-server.mjs` on `127.0.0.1:8101` with CMS article pages
enabled, reaching Strapi through a test-only, read-only (GET) reverse proxy on `127.0.0.1:8105` (needed because the
local CMS CORS list only allows `:8099`, which was occupied). **No hosted/staging CMS exists, so this is NOT a live
CMS test.** The production website has the CMS disabled (verified, see `FRONTEND_QA_TEST_MATRIX.md`).

Login: the site owner logged in to the admin personally (Super Admin). The assistant never typed credentials.

## Test entries (all titled "QA TEST …", all **unpublished** at the end, none deleted)

| Type | Title | Slug | Regions | Document |
|---|---|---|---|---|
| Blog | QA TEST Blog HK only | `qa-test-blog-hk-only` | hk | `txzrwxnheckr8w301mnd13r9` |
| Blog | QA TEST Blog IN only | `qa-test-blog-in-only` | in | `gt02u3mhw5jqff284l9arj7o` |
| Blog | QA TEST Blog PH only | `qa-test-blog-ph-only` | ph | `mpnezja32dsvqm2vl87q52fp` |
| Blog | QA TEST Blog all regions | `qa-test-blog-all-regions` | hk, in, ph | `fvuarcrgwmtaawjvuo0wg6qn` |
| News | QA TEST News HK and PH | `qa-test-news-hk-ph` | hk, ph | `sfcagnag6rgg66y159f2acbw` |
| Media | `qa-test-featured.webp` (copy of the site's `blog-hero-banner.webp`) | — | — | uploaded once, reused |

Pre-existing owner drafts ("Beverage Trends in Asia…", "new news") were not touched.
Cleanup still possible later: delete the 5 drafts and the uploaded image (only with the owner's approval).

## Results

| # | Step | Result | Evidence |
|---|---|---|---|
| B1 | Create blog (title, slug, excerpt, body, featured image upload, region, date, SEO) | PASS | Saved document; upload 1866×843 WebP |
| B2 | Draft not public | PASS | API `total 0` (also with `?status=draft`), detail URL 404 |
| B3 | Publish → regional listing | PASS | HK listing: 1 CMS card first + 4 static cards; card image `medium` 750×339 with intrinsic size |
| B4 | Article page | PASS | Title, h1, body, featured image, date "Nov 17, 2026", meta description, og:image, JSON-LD BreadcrumbList+Article |
| B5 | Edit + Save (no publish) does not change the live page | PASS | Site still showed "version 1"; status "Modified" |
| B6 | Republish shows the update | PASS | Page showed "version 2" immediately (`Cache-Control: private, no-cache`) |
| B7 | Unpublish → removed | PASS | API `total 0`; all 4 blog URLs 404 in all regions; listings back to static (`keep-static`) |
| N1–N4 | News: create, draft hidden, publish, unpublish | PASS | HK/PH 200, IN 404; source link `rel="noopener noreferrer"`; `og:locale en_PH` on PH |
| R1 | Regional isolation (detail URLs) | PASS | hk-only 200/404/404, in-only 404/200/404, ph-only 404/404/200, all-regions 200/200/200 (hk/in/ph) |
| R2 | Regional isolation (listings) | PASS | HK: hk-only + all; IN: in-only + all; PH: ph-only + all (after fix of R3) |
| R3 | **Duplicate keeps regions** | **FAIL (CMS)** | Duplicating PH-only and adding HK + IN showed 3 regions in the form, but **only HK + IN were saved**; the inherited Philippines relation was dropped. Fixed manually by re-adding it. |
| M1 | Media formats and URLs | PASS | original, large, medium, small, thumbnail → all 200 `image/webp` |
| M2 | Missing image | N/A in CMS | `featuredImage` is required, so a published entry always has one; placeholder path tested with mock data |
| M3 | Mobile article (375px) | PASS | No horizontal overflow; date, title, body, image, CTA, related articles |
| P1 | Content Manager role restrictions | **BLOCKED** | Only a Super Admin user exists; no Content Manager test account |

Not covered by the CMS-rendered pages (expected): the Worker templates are stale, so CMS article pages lack the
region attribute/switcher, CLS fix and newsletter guard (backend regeneration pending).

## Content-editor (portal UX) findings — backend-owned

| # | Finding | Impact | Suggested backend change |
|---|---|---|---|
| U1 | Duplicate drops relations inherited from the source when other relations are added (R3) | Content silently missing from a region | Report to backend; until fixed, editors must re-check regions after duplicating, or avoid Duplicate |
| U2 | In the duplicate (clone) view, **Publish does nothing until the entry is saved** — no message | Editors think they published | Train editors: Save first; check Strapi version (5.62 available) |
| U3 | Slug is pre-filled with the type name ("blog") before a title is typed | Wrong/duplicate slugs | Configure the uid to regenerate from title; add a slug format rule `^[a-z0-9]+(-[a-z0-9]+)*$` |
| U4 | `publicationDate` time defaults to 00:00 in the editor's browser time zone (stored 18:30 UTC the day before for IST) | Dates may show a day earlier/later in another region | Field description, or switch to a date-only field |
| U5 | Field labels are raw technical names (`featuredImage`, `metaTitle`, `noIndex`, `ogTitle`), no descriptions | Editor confusion, esp. SEO fields | Add labels/descriptions in "Configure the view" |
| U6 | Region picker offers "Create a relation" | Editors could create new Region entries | Hide creation for Region, or restrict Region create to admins |
| U7 | No visible explanation that a region decides which website shows the entry | Wrong regional publishing | Field description on `regions` |
| U8 | Body editor: clicking the toolbar area does not focus the editor; long form scrolls inside its own container | Minor | — |
