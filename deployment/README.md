# Deployment

Public domain: https://velzaglobal.com/

Route internally by country/preference:
- IN -> /regions/in/
- PH -> /regions/ph/
- HK -> /regions/hk/
- Other -> /regions/hk/

Use server/CDN/edge internal rewrite. Do not redirect visitors to velzaglobal.in or velzaglobal.ph.

The browser must continue to display https://velzaglobal.com/.

The exact configuration depends on the deployment platform (Cloudflare, Nginx, Apache/cPanel, AWS, etc.).
