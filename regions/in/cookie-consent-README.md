# Velza Global — Consent Management System

Not a legal compliance certification. This is the **technical mechanism**.
See "Before production" at the bottom for what you still have to configure.

---

## 1. Files

| Action | Path |
| --- | --- |
| CREATED | `assets/css/cookie-consent.css` |
| CREATED | `assets/js/cookie-consent.js` |
| CREATED | `cookie-consent-README.md` (this file) |
| MODIFIED | all 23 `*.html` — three insertions each, listed below |

Nothing else was touched. `theme.css`, `theme-colors.css`, `custom.css`,
`theme.js` and `custom.js` are byte-identical to before.

### The three insertions per page

**1. Consent Mode v2 defaults — inserted immediately above the GTM snippet, line 4**

```html
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag("consent", "default", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
        functionality_storage: "denied",
        personalization_storage: "denied",
        security_storage: "granted",
        wait_for_update: 500
    });
    gtag("set", "ads_data_redaction", true);
    gtag("set", "url_passthrough", true);
</script>
```

This **must** stay above the GTM snippet. If GTM loads first, tags fire
before the defaults land and the gate is bypassed.

**2. Stylesheet — last in the CSS chain, after `responsive-fix.css`**

```html
<link href="assets/css/cookie-consent.css" rel="stylesheet" />
```

**3. Script — last thing before `</body>`**

```html
<script src="assets/js/cookie-consent.js"></script>
```

On the eight error pages (`400/401/403/404/500/502/503/504`) both paths are
root-relative (`/assets/...`) because an error page can be served for a URL
at any depth.

No HTML markup was added to your pages. The banner, modal and settings
button are constructed in JS with `createElement` + `textContent`, appended
to `document.body` on DOM ready. Zero `innerHTML` on any string that could
carry input.

---

## 2. Design tokens used

I did **not** use the red from the brief. Here is why.

The brief specified a deep red accent (`#B51218` / `#C1121F`) and an
18–24px radius, but also said to inspect the site and use the real values.
Those conflict. The live site's own `vg-` component layer defines:

```css
--vg-gold: #ffffff;                        /* the accent — white, not red */
--vg-card-bg: rgba(255,255,255,0.02);
--vg-card-border: rgba(255,255,255,0.14);
--vg-card-border-hover: rgba(255,255,255,0.4);
--vg-ink-muted: rgba(255,255,255,0.65);
```

Cards use `border-radius: 10px`, easing `cubic-bezier(0.16,0.84,0.44,1)`,
shadow `0 30px 60px -20px rgba(0,0,0,0.65)`, type Poppins with Syncopate
for display. There is no red anywhere in the palette — the only red on the
page is the Hong Kong flag glyph in the country switcher.

So the consent UI is monochrome: white accent, 10px radius, matching
borders, shadows and easing. Buttons reuse `.btn` (white fill, black text)
and `.btn-outline-light` (`rgba(0,0,0,0.64)` on `rgba(242,242,242,0.26)`)
values exactly. Focus rings reuse the existing 3px soft-halo pattern.

**Injecting red would have introduced a colour your site does not use.**
If Velza red is genuinely part of the brand and simply hasn't reached the
site yet, change two lines at the top of `cookie-consent.css`:

```css
--vgc-accent: #C1121F;
--vgc-accent-soft: rgba(193, 18, 31, 0.18);
```

Everything else follows from those.

`z-index` sits at 10050 (modal 10055). Your theme peaks at 10001 for the
offcanvas nav, so the consent layer clears it.

---

## 3. Google Tag Manager — how this interacts

GTM container `GTM-W333F6RK` was already hard-coded in the `<head>` of every
page. **I did not duplicate it, move it, or wrap it.** It still loads exactly
as before.

Instead the system uses **Google Consent Mode v2**:

1. The head snippet sets every non-essential signal to `denied` before GTM boots.
2. GTM loads and its tags respect those signals — tags configured for
   additional consent checks simply do not fire.
3. On a consent choice, `gtag('consent','update', {...})` flips the relevant
   signals, and a `velza_consent_update` event is pushed to `dataLayer`.

**You must do this in the GTM UI — the code alone is not enough:**

- Admin → Container Settings → enable **Consent Overview**.
- For each tag, open Consent Settings and declare the required consent type
  (GA4 → `analytics_storage`; Ads/Floodlight → `ad_storage`, `ad_user_data`,
  `ad_personalization`).
- Tags with no declared consent type fire regardless of the signals. This is
  the single most common way a consent setup silently does nothing.
- Optional: create a Custom Event trigger on `velza_consent_update` if you
  want tags to fire the moment consent is granted rather than on next pageview.

Signal mapping is in `CONSENT_MODE_MAP` in the JS if you need to change it.

---

## 4. Google Analytics 4

Two delivery paths. **Pick one.**

**Path A — GA4 inside GTM (recommended, matches your current setup).**
Leave `analyticsId` empty. Declare `analytics_storage` on the GA4 tag in GTM.
Done.

**Path B — GA4 loaded directly.** Set the ID:

```js
analyticsId: "G-XXXXXXXXXX",
enableAnalytics: true
```

`loadAnalytics()` then injects `gtag/js` only when `analytics === true`,
once per page view, with `anonymize_ip: true`.

If you set `analyticsId` **and** GA4 also fires in GTM you will double-count
every pageview. The code logs a console warning when it detects this, but it
cannot stop you.

---

## 5. Marketing scripts

`loadMarketingScripts()` is intentionally empty — no Meta Pixel, no LinkedIn
tag, nothing was added. When you actually have one, put it there; it runs
only when `marketing === true`.

For anything in your HTML, use the gated-script pattern instead:

```html
<script type="text/plain" data-cookie-category="marketing">
    /* inline code — will not execute until marketing consent */
</script>

<script
    type="text/plain"
    data-cookie-category="analytics"
    data-cookie-src="https://example.com/tracker.js"></script>
```

`type="text/plain"` is what stops the browser executing it. On consent the
script is cloned with its real type and inserted, once. Use
`data-cookie-src` rather than `src` so nothing is even fetched pre-consent.

**Worth knowing:** your pages load two third-party scripts unconditionally
that a strict reading would gate — Leaflet from `unpkg.com` and the
flag-icons CSS from `cdnjs.cloudflare.com`, both on the contact page and
index. They set no cookies, but the request itself exposes visitor IPs to
those CDNs. Self-host them or gate them behind `preferences`.

---

## 6. Adding a category

Append to `CATEGORY_DEFS`, and optionally to `CONSENT_MODE_MAP`:

```js
{
    id: "social",
    label: "Social Media Cookies",
    description: "Enable embedded social content.",
    locked: false,
    defaultValue: false
}
```

The UI row, storage key, gating and signal mapping all pick it up. Bump
`COOKIE_CONSENT_VERSION` so existing visitors are re-asked.

---

## 7. Cookie inventory

`COOKIE_CATEGORIES` is **deliberately empty**. I will not list cookies your
site may not set. Populate it from a real audit: open DevTools →
Application → Cookies on a page where you have accepted everything, and
record what is actually there.

Typical findings for a stack like yours:

| Category | Likely entries |
| --- | --- |
| necessary | `velza_cookie_consent` (this system, 395 days) |
| analytics | `_ga`, `_ga_<container>` (Google, 2 years), `_gid` (24h) |
| marketing | `_gcl_au` (Google Ads, 90 days) — only if Ads is live |
| preferences | anything your regional switcher sets |

Also audit: YouTube embeds (`VISITOR_INFO1_LIVE`, `YSC` — use
`youtube-nocookie.com`), Google Maps, and the Leaflet/cdnjs requests above.
Your "Get Directions" links are plain outbound links, so they set nothing
until clicked — that is fine.

Shape:

```js
analytics: [
    { name: "_ga", provider: "Google", purpose: "Distinguishes users", duration: "2 years", type: "HTTP" }
]
```

Populated entries render inside the modal under their category.

---

## 8. Policy links

```js
privacyPolicyUrl: "/privacypolicy.html",   // exists — verified
cookiePolicyUrl: ""                        // does NOT exist yet
```

**There is no cookie policy page on your site.** I left the URL empty, so
that link is not rendered rather than pointing at a 404. You need to create
one — `cookiepolicy.html`, cloned from `privacypolicy.html` for styling
consistency — covering: what cookies are, the four categories and what each
does, the actual cookie table from section 7, third-party recipients and
their own policies, retention periods, how to withdraw consent (mention the
Cookie Settings button), and browser-level cookie controls.

Once it exists, set `cookiePolicyUrl: "/cookiepolicy.html"`, add it to
`sitemap.xml`, and link it in the footer.

Your current `privacypolicy.html` should also gain a cookies section
cross-referencing it.

---

## 9. Debug mode

`COOKIE_DEBUG = true` logs:

```
[Velza Cookie] Banner initialized
[Velza Cookie] Consent loaded {...}
[Velza Cookie] Analytics enabled (G-XXXX)
[Velza Cookie] Marketing disabled
[Velza Cookie] Consent Mode updated {...}
```

Set to `false` before launch.

---

## 10. Test results

I ran the consent engine under a DOM stub. Verified programmatically:

| Test | Result |
| --- | --- |
| 2 — Accept All | all four true, both loaders invoked |
| 3 — Reject All | necessary only, loaders skipped |
| 4 — Analytics only | `analytics: true`, `marketing: false` |
| 5 — Reload, same version | stored consent restored, banner suppressed |
| 7 — Withdraw | non-essential false, cookie deleted, banner returns |
| 8 — Version bump 1.0 → 2.0 | consent discarded, analytics back to false |
| — Necessary cannot be disabled | forced true even when passed `false` |
| — Consent Mode | correct granted/denied signals pushed each time |

**Still needs a real browser from you** — I have no browser here:

- TEST 1 first-visit banner entrance animation
- TEST 6 modal open from the settings button
- TEST 9 mobile at 360/390/414px: no horizontal scroll, buttons tappable
- TEST 10 keyboard only: Tab through banner, Enter to open modal, Tab cycles
  inside it, Esc closes, focus returns to the settings button
- Screen reader pass (NVDA or VoiceOver)
- That the banner does not collide with the back-to-top button (it is
  bottom-right, banner is bottom-left — should be clear, but confirm)
- That GSAP ScrollSmoother is unaffected while the modal is open

---

## 11. Before production

- [ ] `COOKIE_DEBUG = false`
- [ ] Create the cookie policy page, set `cookiePolicyUrl`
- [ ] Populate `COOKIE_CATEGORIES` from a real DevTools audit
- [ ] Declare consent types on every tag in GTM, enable Consent Overview
- [ ] Decide GA4 delivery: GTM **or** `analyticsId`, never both
- [ ] Self-host or gate the unpkg/cdnjs third-party requests
- [ ] Switch YouTube embeds to `youtube-nocookie.com` if any exist
- [ ] Add a cookies section to `privacypolicy.html`
- [ ] Confirm the banner's reject button is as prominent as accept (it is —
      same size, equal weight; do not "improve" this)
- [ ] Have a privacy advisor review copy, legal basis, retention and vendors
      for your actual markets — Hong Kong PDPO, EU GDPR if you serve EU
      visitors, India DPDP Act, Philippines Data Privacy Act. Those differ,
      and the code cannot decide them for you.
