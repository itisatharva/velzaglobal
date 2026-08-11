# Velza Global — velzaglobal.com

Static multi-region marketing site. Three regional content sets are served from
one domain by an Apache rewrite that reads Cloudflare's geo-IP header, so the
visitor's URL is always `https://www.velzaglobal.com/` regardless of region.

- **Hosting:** Namecheap shared hosting (cPanel / Apache 2.4 / PHP)
- **CDN & geo-IP:** Cloudflare (free tier, proxied DNS)
- **Deploys:** push to `main` → GitHub Actions → FTPS → live
- **Build step:** none. Files are deployed exactly as committed.

---

## 1. Repository layout

The repository root **is** the web root. What you see here is what lands in
`public_html/`.

```
.htaccess              Master Apache config: geo-routing, canonical URLs, security
assets/                Shared CSS/JS/images/video — ONE copy used by all regions
region/                Region config + client-side switcher
regions/hk/*.html      Hong Kong / HQ pages — the global default and master copy
regions/ph/*.html      Philippines pages
regions/in/*.html      India pages
Ph/Events/PR/          RSVP / event subsystem (PHP + MySQL) — not geo-routed
deployment/            Docs and reference configs (not deployed)
.github/workflows/     CI + deployment
robots.txt sitemap.xml favicon.ico site.webmanifest apple-touch-icon.png
```

### Why `assets/` is at the root and must stay there

Page HTML references assets **relatively** (`assets/css/theme.css`, 55 times per
page). Under geo-routing the browser's URL is `/aboutus` while the file served is
`regions/in/aboutus.html`, so relative references resolve against `/` — i.e. to
`/assets/css/theme.css` at the web root.

Moving `assets/` back inside the region folders breaks every stylesheet, script,
image and video on the site. The `assets/` directories were byte-identical across
all three regions, so consolidating them also cut the repo from ~190 MB to ~63 MB.
A CI check enforces this.

---

## 2. How regional routing works

```
                    Visitor hits www.velzaglobal.com
                                  │
                    Cloudflare adds CF-IPCountry header
                                  │
                     Apache .htaccess §3L decides region
                                  │
          ┌───────────────────────┼───────────────────────┐
    velzaRegion cookie?     CF-IPCountry=IN / PH      everything else
          │                       │                       │
     that region            in / ph                      hk
          └───────────────────────┼───────────────────────┘
                                  │
              internal rewrite → regions/<code>/<page>.html
                                  │
                  URL still shows www.velzaglobal.com/aboutus
```

**Precedence — cookie beats geo-IP.** A visitor who deliberately picks a region
in the on-site switcher gets a `velzaRegion` cookie, and that choice wins on
every later request. Geo-IP only decides for visitors who have never chosen.

**Country mapping:** `IN → regions/in`, `PH → regions/ph`, everything else
(including HK itself, and Cloudflare's `XX`/`T1` non-country codes) → `regions/hk`.

The cookie value is constrained to `(hk|ph|in)` by the rewrite regex, so a
hand-crafted cookie cannot inject a path into the rewrite target.

`region/region-switcher.js` writes the cookie **and reloads the page** — the
server decides the content, so without a reload nothing below the switcher label
would change. It treats the cookie as authoritative and restores it from
`localStorage` if it has expired.

### Caching constraint — important

HTML now varies per visitor, so it is served `private, no-cache` with
`Vary: CF-IPCountry, Cookie`. Static assets are identical for every region and
stay cached for a year, so the cost is negligible.

**Do not add a Cloudflare "Cache Everything" page rule for `velzaglobal.com/*`.**
It would cache geo-routed HTML at the edge and serve one country's homepage to
everyone. Cloudflare's free tier does not cache HTML by default, which is correct
here.

---

## 3. Local development

There is no build step or dependency install.

```bash
# From the repository root — serve the whole root, not a region folder
python3 -m http.server 8000
```

Plain static servers ignore `.htaccess`, so you get **no** geo-routing,
extensionless URLs, or PHP. Browse a region directly:
`http://localhost:8000/regions/hk/index.html`.

### Testing the routing for real

To exercise the actual rewrite rules you need Apache with `mod_rewrite`. macOS
ships one:

```bash
httpd -f /path/to/test-httpd.conf   # DocumentRoot = repo root, AllowOverride All
curl -H "Host: www.velzaglobal.com" -H "X-Forwarded-Proto: https" \
     -H "CF-IPCountry: IN" http://127.0.0.1:8791/ | grep -o 'velzaglobal..'
```

Simulate the inputs Cloudflare supplies with headers:

| Simulating | Header |
| --- | --- |
| Visitor in India | `-H "CF-IPCountry: IN"` |
| Visitor who chose Philippines | `-H "Cookie: velzaRegion=ph"` |
| HTTPS via Cloudflare | `-H "X-Forwarded-Proto: https"` |

Note: on macOS, Apache cannot read files under `~/Desktop` or `~/Documents` due
to system privacy protection — copy the site elsewhere to test.

---

## 4. Deployment

### Chosen approach: GitHub Actions → FTPS

Push to `main`, CI checks run, and changed files sync to `public_html/`.
See `.github/workflows/deploy.yml`.

**Why this and not the alternatives:**

| Option | Verdict |
| --- | --- |
| **GitHub Actions + FTPS** | **Chosen.** Works on every Namecheap plan. Genuine push-to-deploy. Incremental — the action keeps a manifest on the server and transfers only changed files, so after the ~63 MB first run deploys take seconds. Credentials live in GitHub Secrets. |
| cPanel Git Version Control | Rejected as primary. cPanel does **not** automatically pull from GitHub — you would push to a second cPanel-hosted remote, or click "Update from Remote" by hand, which is the manual step this project exists to remove. Worth keeping as a disaster-recovery path. |
| rsync over SSH | Better transport — faster, and handles deletes cleanly. But SSH is not enabled on entry-level Namecheap Stellar plans. **If your plan has SSH, switch to this**; swap the deploy step for `rsync -az --delete` with an SSH key in secrets. |

**Known tradeoffs of the FTPS approach**

- Not atomic. Mid-deploy a visitor can briefly get a mix of old and new files.
  Acceptable for a static marketing site; a real fix means deploying to a fresh
  directory and swapping a symlink, which shared hosting makes awkward.
- FTP credentials are a full FTP account. Create one **scoped to the web root**
  rather than reusing the main cPanel login.
- The action never deletes anything in its `exclude` list, which is how the
  server-side RSVP logs survive deploys. Never set `dangerous-clean-slate: true`.

### Branching for two contributors

```
main       → production. Protected. Deploys on merge.
staging    → optional preview at staging.velzaglobal.com. Deploys on push.
feature/*  → open a PR into main; CI checks run on the PR.
```

Because the three regions are duplicated copies rather than templates, **a
content change usually has to be made three times**. CI fails the build if the
regions stop exposing the same set of pages. Before opening a PR:

```bash
diff -rq regions/hk regions/ph
diff regions/hk/index.html regions/in/index.html
```

Legitimate differences are the social media URLs (`velzaglobalhk` /
`velzaglobalph` / `velzaglobalin`) and region-specific contact copy. Anything
else is drift.

### Preview / staging

The workflow already supports a `staging` branch deploying to a separate web
root. It stays dormant until you create the subdomain and set the
`staging` environment secrets — nothing breaks in the meantime.

A staging subdomain on the same Namecheap host is the right choice here rather
than a static preview service: previews need real Apache, real `.htaccess` and
real PHP, or they will not reproduce the geo-routing or the RSVP forms at all.

---

## 5. Credentials

Nothing secret is in this repository, and nothing secret should be added.

- **Database and SMTP** for the RSVP subsystem are read at runtime from
  `/home/velzhsrg/private_config/rsvp_db.php` and `rsvp_smtp.php` — **outside**
  the web root, on the server only. Keep it that way.
- **FTP credentials** live in GitHub Secrets, never in the repo.
- Server logs (`error_log`, `reminder_mail.log`, `send_reminders.lock`) are
  gitignored. `reminder_mail.log` contains real attendee email addresses;
  committing it would put personal data into git history permanently, where
  deleting the file afterwards does not remove it.

The contact and subscribe forms are **not currently functional**:
`assets/vendor/simple-forms/config.php` still holds template placeholders and
`assets/js/form.js` has `siteKey: "CHANGEME"` for reCAPTCHA v3. Both sides need
real values before the forms will send.

---

## 6. Manual steps — checklist

None of these can be done from the repository; they need your account access.
Roughly in order.

### A. GitHub

- [ ] Create the repository as **private** under the company account (not a
      personal one), named e.g. `velzaglobal-website`.
- [ ] Push this repo: `git remote add origin <url> && git push -u origin main`
- [ ] Add the second contributor as a collaborator with write access.
- [ ] Protect `main`: require a PR, require the `checks` job to pass.
      Settings → Branches → Add rule.

### B. FTP account (Namecheap cPanel)

- [ ] cPanel → FTP Accounts → create a dedicated account, e.g.
      `deploy@velzaglobal.com`, with its directory scoped to `public_html`.
      Do **not** reuse the main cPanel login.
- [ ] Confirm FTPS (explicit TLS on port 21) connects — Namecheap supports it.

### C. GitHub Secrets

Settings → Environments → create `production` (and later `staging`), then add:

- [ ] `FTP_SERVER` — e.g. `ftp.velzaglobal.com` or the server hostname from cPanel
- [ ] `FTP_USERNAME` — the deploy FTP account
- [ ] `FTP_PASSWORD`
- [ ] `FTP_SERVER_DIR` — `public_html/` for production (trailing slash required)
- [ ] Optionally require reviewers on the `production` environment so deploys
      to live need approval.

### D. Cloudflare

- [ ] Add `velzaglobal.com` to Cloudflare (free plan).
- [ ] At Namecheap: Domain → Nameservers → **Custom DNS** → the two nameservers
      Cloudflare gives you. Propagation is usually minutes, up to 24h.
- [ ] Verify the A/CNAME records Cloudflare imported match Namecheap's, before
      the nameserver switch. **Check MX and any TXT/SPF/DKIM records survived**
      or email to the domain will break.
- [ ] `www` and root records must be **Proxied** (orange cloud). `CF-IPCountry`
      is only injected on proxied traffic — grey cloud means no geo-routing.
- [ ] SSL/TLS mode → **Full (strict)**. *Flexible mode will cause an infinite
      redirect loop* with the HTTPS rules in `.htaccess`, because Cloudflare
      would always talk plain HTTP to the origin.
- [ ] Confirm no "Cache Everything" page rule exists for `velzaglobal.com/*`
      (see the caching warning in §2).
- [ ] Leave "IP Geolocation" enabled (Network settings) — it is what adds the
      `CF-IPCountry` header.

### E. First deployment — cutover

- [ ] **Back up `public_html` first** (cPanel → File Manager → compress, or
      Backup Wizard). This restructure changes the site's entire layout.
- [ ] The site currently has the HK files sitting directly in `public_html`.
      The incremental deploy will not remove them, and stale leftovers can
      shadow new files. After backing up, **empty `public_html`** except:
      - `.well-known/` (certificate validation)
      - `cgi-bin/` if present
- [ ] Verify `/home/velzhsrg/private_config/` still contains `rsvp_db.php` and
      `rsvp_smtp.php` — it is outside `public_html` and unaffected, but confirm.
- [ ] Push to `main` and watch the Actions run. First upload is ~63 MB.
- [ ] Confirm `.htaccess` uploaded — some FTP clients hide dotfiles.

### F. Verify after go-live

```bash
# Region routing (should return each region's social handle)
curl -s https://www.velzaglobal.com/ | grep -o 'velzaglobal..' | head -1

# Confirm no redirect — URL must stay put
curl -sI https://www.velzaglobal.com/aboutus | head -1     # expect 200, not 301

# Canonical redirects
curl -sI https://velzaglobal.com/aboutus | grep -i location  # -> www
curl -sI https://www.velzaglobal.com/aboutus.html | grep -i location

# Internal paths hidden
curl -sI https://www.velzaglobal.com/regions/in/aboutus.html | grep -i location

# Caching safety
curl -sI https://www.velzaglobal.com/ | grep -iE 'cache-control|vary'
```

- [ ] Test real geo-routing with a VPN or a phone on mobile data in India/PH,
      or ask a colleague there. You cannot fake `CF-IPCountry` against
      production — Cloudflare overwrites a client-supplied header.
- [ ] Use the on-site country switcher and confirm the page reloads into the
      chosen region and *stays* there on the next navigation.
- [ ] Check Google Search Console for crawl errors over the following week.

### G. Follow-up work not covered here

- [ ] **RSVP admin endpoints are closed by default** in `.htaccess` §5B —
      `host_view.php`, `update_issue.php` and `team/` return 403. They had no
      authentication at all and exposed registrant PII. Re-open them behind
      HTTP Basic auth (instructions are in that section) if event staff still
      need them; the fix in the application itself is still outstanding.
- [ ] Rotate any credentials that may have been exposed while those endpoints
      were public, and consider whether the exposure is notifiable.
- [ ] Fix the contact/subscribe forms (§5).
- [ ] `regions/in/` has drifted from `hk`/`ph` — see CLAUDE.md.
- [ ] Optimise media: one 5.2 MB PNG and an 7.8 MB MP4 dominate page weight.
