# Velza Global — velzaglobal.com

The company website. One domain, three regional editions, served from a single
codebase.

Velza Global Group distributes premium FMCG, beverage and lifestyle brands across
Hong Kong (HQ), the Philippines and India. Visitors see the edition for their
country automatically, and the address bar always reads
`https://www.velzaglobal.com/`.

- **Deployment, credentials, cutover steps** → `deployment/README.md`
- **Architecture and its constraints** → `CLAUDE.md`
- **Routing specification** → `REGIONAL-ROUTING.md`

---

## The three editions

| Edition | Folder | Served to |
| --- | --- | --- |
| Hong Kong (HQ) | `regions/hk/` | Hong Kong, and every country without its own edition |
| Philippines | `regions/ph/` | Philippines |
| India | `regions/in/` | India |

Each folder holds a complete set of **23 pages**. They are duplicated copies, not
templates — the same page exists three times, and a content change is normally
made three times. What legitimately differs between them is the regional social
media accounts (`velzaglobalhk` / `velzaglobalph` / `velzaglobalin`) and
region-specific contact details.

Hong Kong is the master copy. New work starts there.

---

## Site map

14 public pages, listed in site order. Every URL is extensionless — `/aboutus`,
never `/aboutus.html`.

```
/                        Home — group overview, featured brands, latest news
│
├── /aboutus             About the group — story, capabilities, markets
│
├── /portfolio           Brand portfolio — index of everything distributed
│   ├── /luxurybeverage        Tonino Lamborghini caffeinated beverages
│   ├── /pureitalianspirits    Premium Italian spirits collection
│   ├── /coffeecollection      Premium Italian coffee collection
│   ├── /lifestyleessentials   Lifestyle essentials range
│   └── /rossocaffe            Rosso Caffè — Italian café experience
│
├── /news                Newsroom — partnerships, launches, milestones
│   ├── /news1                 Tonino Lamborghini × Velza Global, Philippines
│   └── /news2                 Tonino Lamborghini × Velza Global, India
│
├── /contactus           Contact — Hong Kong, Philippines and India offices
│
└── Legal
    ├── /privacypolicy
    └── /termsandconditions
```

### Pages not in the public site map

| URL | Purpose |
| --- | --- |
| `/comingsoon` | Placeholder for unreleased sections. Excluded from search engines. |
| `/400` `/401` `/403` `/404` `/500` `/502` `/503` `/504` | Branded error pages. Served by Apache at the original status code, and regional like any other page. |

---

## Repository layout

The repository root **is** the web root — what is committed is what lands in
`public_html/`.

```
.htaccess                  Routing, canonical URLs, security, caching
│
assets/                    Shared by all three editions — ONE copy
│   ├── css/               theme, custom, cookie consent, responsive fixes
│   ├── js/                theme engine, forms, consent, counters
│   ├── images/  img/      photography and graphics
│   ├── video/             hero and feature video
│   └── vendor/            jQuery, Bootstrap, GSAP, slick, Leaflet, forms
│
region/                    Region config and the country switcher
│   ├── region-config.js       valid region codes
│   └── region-switcher.js     writes the preference cookie, reloads
│
regions/
│   ├── hk/                23 pages — Hong Kong (master copy)
│   ├── ph/                23 pages — Philippines
│   └── in/                23 pages — India
│
Ph/Events/PR/              RSVP and event subsystem (PHP + MySQL)
deployment/                Deployment docs and handover checklists
.github/workflows/         CI checks and the deploy pipeline
│
robots.txt  sitemap.xml  favicon.ico  site.webmanifest  apple-touch-icon.png
```

### Why `assets/` sits at the root

Page HTML references assets **relatively** (`assets/css/theme.css`). Because the
browser's address stays at `/aboutus` while the file served is
`regions/in/aboutus.html`, those references resolve to `/assets/…` at the web
root. One shared copy is what makes that work — and since the three copies were
byte-identical, consolidating them also took the repository from ~190 MB to
~63 MB.

Moving `assets/` back inside the region folders breaks every stylesheet, script
and image on the site. A CI check enforces it.

---

## How a URL becomes a file

```
Visitor requests  https://www.velzaglobal.com/aboutus
                             │
        Cloudflare adds the CF-IPCountry header
                             │
              .htaccess picks the edition
        cookie choice  →  country  →  Hong Kong default
                             │
        internally serves  regions/in/aboutus.html
                             │
        address bar still reads  /aboutus
```

Two things follow from this:

- **The `/regions/` path is never public.** Anything requesting it directly is
  redirected back to the canonical URL, so there is only ever one address for a
  given page.
- **A visitor's own choice wins.** Picking a country in the on-site switcher
  stores a preference that overrides country detection on every later visit.

Full detail in `REGIONAL-ROUTING.md`.

---

## The RSVP subsystem

`Ph/Events/PR/` is a self-contained PHP and MySQL application for Philippine
event registration — a public RSVP form, confirmation emails with generated
attendee IDs, a reminder mailer, and check-in tooling. It is **not** part of the
regional website and is not geo-routed; it sits at its own fixed path.

Its administrative pages are closed at the web server layer. See `CLAUDE.md`
before reopening them.

---

## Working on the site

There is no build step and nothing to install. Files are deployed exactly as
committed.

```bash
# Serve the repository root — not a region folder
python3 -m http.server 8000
```

A plain static server ignores `.htaccess`, so you get no regional routing and no
extensionless URLs. Open a specific edition directly:
`http://localhost:8000/regions/hk/index.html`.

To exercise the real routing you need Apache with `mod_rewrite` — see `CLAUDE.md`.

### Before you commit

The editions drift easily. Check them against each other:

```bash
diff -rq regions/hk regions/ph
diff regions/hk/index.html regions/in/index.html
```

Social media URLs and regional contact details are expected to differ. Anything
else is drift, and CI will fail the build if the editions stop offering the same
set of pages.
