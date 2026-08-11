# Deployment

Everything needed to get velzaglobal.com from this repository onto the live
server. For what the site *is* — pages, regions, URL structure — see the root
`README.md`. For the architecture and its constraints, see `CLAUDE.md`.

- **Host:** Namecheap shared hosting (cPanel / Apache 2.4 / PHP 8.1+)
- **CDN / geo-IP:** Cloudflare, free tier, proxied DNS
- **Pipeline:** push to `main` → GitHub Actions → FTPS → `public_html/`
- **Repository:** https://github.com/itisatharva/velzaglobal (private)

## Contents of this directory

| File | Purpose |
| --- | --- |
| `README.md` | This file — deployment, credentials, cutover steps |
| `handover-checklist.md` | 57 details to confirm with the current hosting handler |
| `handover-checklist.html` | The same checklist, openable in a browser |
| `cookie-consent.md` | How the consent system is wired into GTM |
| `redirects-nginx.conf` | Unused reference translation of the legacy redirects, if the site ever moves from Apache to Nginx. Not deployed, not maintained. |

---

## 1. Deployment

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

## 2. Credentials

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

## 3. Manual steps — checklist

None of these can be done from the repository; they need your account access.
Roughly in order.

### A. GitHub

- [x] Create the repository as **private** —
      https://github.com/itisatharva/velzaglobal
- [x] Push `main`.
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
      — it would cache geo-routed HTML at the edge and break regional routing
      for everyone. See the caching section of `CLAUDE.md`.
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
