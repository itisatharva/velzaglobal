# Deployment

**The authoritative deployment documentation is the root `README.md` §4.**
This directory holds supporting reference material only and is excluded from
the deploy.

Public domain: https://www.velzaglobal.com/

## Summary

- **Host:** Namecheap shared hosting (cPanel / Apache 2.4 / PHP)
- **CDN / geo-IP:** Cloudflare, free tier, proxied DNS
- **Pipeline:** push to `main` → GitHub Actions → FTPS → `public_html/`
- **Routing:** internal Apache rewrite in the root `.htaccess`, driven by
  `CF-IPCountry` with a `velzaRegion` cookie override. IN → `/regions/in/`,
  PH → `/regions/ph/`, everything else → `/regions/hk/`. Visitors never see
  a redirect and the URL never changes.

## Contents of this directory

| File | Purpose |
| --- | --- |
| `cookie-consent.md` | How the consent management system is wired into GTM |
| `redirects-nginx.conf` | Unused reference translation of the legacy redirects, in case the site is ever moved from Apache to Nginx. Not deployed and not maintained. |
