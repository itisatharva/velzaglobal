# Velza Global Regional Routing

**Status: implemented.** The routing described here is live in the root `.htaccess`
(sections 3L and 3M). This file is the specification; `README.md` shows how a URL
becomes a file and `CLAUDE.md` covers the rule-ordering constraints.

## Structure

- `regions/hk/` — Hong Kong / HQ master website, and the global default
- `regions/ph/` — Philippines website
- `regions/in/` — India website
- `region/` — shared region preference configuration/switcher
- `assets/` — shared assets for all regions, at the web root (see README)

## Required production behavior

| Visitor | Served |
| --- | --- |
| India (`CF-IPCountry: IN`) | `regions/in/` |
| Philippines (`CF-IPCountry: PH`) | `regions/ph/` |
| Hong Kong | `regions/hk/` |
| Any other country, or unknown (`XX`, `T1`) | `regions/hk/` fallback |

A visitor who has explicitly chosen a region through the on-site switcher carries a
`velzaRegion` cookie, and **that choice overrides geo-detection** on every later
request. Geo-IP decides only for visitors who have never chosen.

The public URL remains `https://www.velzaglobal.com/` in all cases. Routing is an
internal Apache rewrite — not a redirect, and not a move to `velzaglobal.in` or
`velzaglobal.ph`. The `/regions/` path is never publicly linkable; direct requests
to it are 301'd back to the canonical URL.

## Mechanism

Country detection comes from Cloudflare's `CF-IPCountry` request header, which is
injected on every proxied request. Apache/cPanel has no geo-IP capability of its
own, which is why Cloudflare sits in front of the origin.

This requires the DNS records to be **proxied** (orange cloud) — on grey-cloud
records the header is absent and every visitor falls back to `regions/hk/`.
