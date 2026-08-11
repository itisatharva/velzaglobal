# Hosting handover — details to verify

Questions to put to whoever currently manages the Velza Global hosting, domain
and server ("the handler") before the GitHub migration and Cloudflare cutover.

Each item says **why it matters**, so if the handler pushes back you can explain
what breaks without it. Items marked **BLOCKER** must be answered before the
nameserver change or the first deploy; the rest can follow.

Canonical copy of this checklist. See `README.md` §6 for the steps you perform
yourself once these answers are in.

---

## A. Account and access

| # | Ask for | Why it matters |
| --- | --- | --- |
| A1 **BLOCKER** | cPanel login URL, username, password | The code hard-codes `/home/velzhsrg/private_config/...`, so the account is very likely `velzhsrg` — confirm. Everything else depends on this access. |
| A2 **BLOCKER** | Namecheap account login (may be separate from cPanel) | The nameserver change to Cloudflare is made in the Namecheap domain panel, not cPanel. |
| A3 | Is the domain registered at Namecheap, or elsewhere? | If the registrar is a third party, the nameserver change happens there instead. |
| A4 | Who holds 2FA / recovery email on both accounts? | A locked account mid-cutover stops everything. |
| A5 | Exact Namecheap plan name (Stellar / Stellar Plus / Stellar Business) | Determines SSH availability, which decides FTPS vs rsync deployment. |
| A6 | Is the domain locked, and when does it expire? | An expiry during migration is a silent catastrophe. |

## B. Server capability

These confirm the assumptions the new `.htaccess` and RSVP app are built on. Ask
the handler to read them from cPanel → Server Information / Select PHP Version.

| # | Ask for | Why it matters |
| --- | --- | --- |
| B1 **BLOCKER** | Apache version | The routing rules use the `[END]` flag, which needs **Apache 2.4+**. On 2.2 the ruleset will loop or 500. |
| B2 **BLOCKER** | Is `AllowOverride All` set for the document root? | If `.htaccess` is ignored, there is no geo-routing, no extensionless URLs, and no security rules — the entire mechanism is `.htaccess`. |
| B3 **BLOCKER** | Confirm these Apache modules are enabled: `mod_rewrite`, `mod_headers`, `mod_expires`, `mod_deflate`, `mod_filter` | `mod_rewrite` does the routing. `mod_headers` sets the cache/`Vary` headers that stop one country's page being served to another. Missing `mod_filter` causes a 500 on `AddOutputFilterByType`. |
| B4 **BLOCKER** | PHP version | The RSVP portal uses a `never` return type, so it requires **PHP 8.1 or newer**. On 8.0 those files are a parse error. |
| B5 | Is `mysqli` enabled? | The whole RSVP subsystem uses `mysqli`, not PDO. |
| B6 | Is SSH/terminal access available on this plan? | If yes, deployment should switch from FTPS to rsync — faster and handles deletes properly. |
| B7 **BLOCKER** | Is FTPS (explicit TLS, port 21) enabled and reachable from outside? | This is the deployment transport. Plain FTP would send credentials in clear text. |
| B8 | Is there any IP allowlisting or firewall on FTP/cPanel? | GitHub Actions runners use rotating IPs and will be blocked by an allowlist. |
| B9 | Current disk usage and inode count vs the plan limit | The repo is ~63 MB across ~630 files. Shared plans cap inodes and the deploy will fail part-way if it hits the ceiling. |

## C. Current live site — cutover risk

This section is the one most likely to produce a surprise. The restructure changes
the entire on-server layout.

| # | Ask for | Why it matters |
| --- | --- | --- |
| C1 **BLOCKER** | Exact document root path for `velzaglobal.com` (e.g. `/home/velzhsrg/public_html`) | This is the `FTP_SERVER_DIR` secret. Pointing it at the wrong directory deploys the site into a subfolder or over another site. |
| C2 **BLOCKER** | A full recursive file listing of the current document root | To find anything on the server that is **not** in the repo. Whatever exists there and isn't tracked will be left behind as a stale file after cutover. |
| C3 **BLOCKER** | Are there files uploaded or generated at runtime in the web root? | An uploads directory, generated PDFs, or a cache folder would be destroyed or go stale under a repo-driven deploy. They need excluding from the sync. |
| C4 | Any `.htaccess` files in subdirectories? | A leftover subdirectory `.htaccess` silently overrides the new master rules for that path. |
| C5 **BLOCKER** | Confirm `/home/velzhsrg/private_config/rsvp_db.php` and `rsvp_smtp.php` exist, and are **outside** the web root | The RSVP app requires them at runtime and fatals without them. If they have drifted into `public_html`, live DB and SMTP credentials are web-readable right now. |
| C6 **BLOCKER** | List of all cron jobs | `Ph/Events/PR/send_reminders.php` is CLI-only and cron-driven. Its path changes in the restructure, so any cron entry pointing at the old `Ph/Ph/Events/PR/` path will break. |
| C7 | Current backup schedule, retention, and how to restore | Needed before touching anything. Do not rely on the host's automatic backup without confirming a restore has actually been tested. |
| C8 **BLOCKER** | Has anyone been editing files directly on the server? | After cutover, every deploy overwrites the web root from git. Direct edits will be silently destroyed. This practice has to stop, and anyone doing it needs to know. |
| C9 | Is there an existing staging site or dev subdomain? | May already exist and be reusable, or may conflict with `staging.velzaglobal.com`. |

## D. DNS and domain

| # | Ask for | Why it matters |
| --- | --- | --- |
| D1 **BLOCKER** | A full export of the current DNS zone — every A, AAAA, CNAME, MX, TXT, SRV and CAA record | Cloudflare imports records automatically but **misses some**. Without a before-picture you cannot tell what vanished. Screenshot everything. |
| D2 **BLOCKER** | Current nameservers | To confirm what you are replacing, and to roll back. |
| D3 **BLOCKER** | Every subdomain in use (`mail`, `webmail`, `cpanel`, `ftp`, `shop`, regional sites…) | Subdomains not carried into Cloudflare stop resolving the moment nameservers change. |
| D4 | Origin server IP address | Needed to verify the Cloudflare A record points at the right place. |
| D5 | Do `velzaglobal.in` and `velzaglobal.ph` exist? Where do they point, and are they being kept? | The regional routing deliberately does **not** redirect to them. Confirm whether they should redirect to the main domain, or be left alone. |
| D6 | Any third-party service using a DNS record for verification (Google Workspace, M365, SendGrid, Search Console)? | These TXT/CNAME records break verification if lost, sometimes weeks later. |
| D7 | Can the TTLs be lowered to 300s a day before the switch? | Shortens the rollback window from hours to minutes. |

## E. Email — highest-risk item

A nameserver change is the single most common way to take down a company's email.
Treat this section as non-negotiable.

| # | Ask for | Why it matters |
| --- | --- | --- |
| E1 **BLOCKER** | Is email hosted on this same cPanel, or externally (Google Workspace / Microsoft 365 / Namecheap Private Email)? | Determines whether MX must point at the origin server or an external provider. |
| E2 **BLOCKER** | Exact current MX records with priorities | If these are not recreated in Cloudflare exactly, all inbound mail stops. |
| E3 **BLOCKER** | SPF, DKIM and DMARC TXT records, verbatim | Lose these and outbound mail starts landing in spam — which often is not noticed for days. |
| E4 | Which mail accounts exist and who depends on them? | So you know who to warn, and who to ask to test afterwards. |
| E5 | The MX host must stay **grey-cloud / DNS-only** in Cloudflare | Proxying a mail record breaks mail delivery. Confirm the handler understands this. |
| E6 | Which address does the site send from? (`events@velzaglobal.ph` is hard-coded in `submit.php`) | Confirms the SMTP account is still valid and the domain is authorised to send. |

## F. SSL / certificates

| # | Ask for | Why it matters |
| --- | --- | --- |
| F1 **BLOCKER** | What issues the current certificate — cPanel AutoSSL, Let's Encrypt, or a purchased cert? | Cloudflare must be set to **Full (strict)**, which requires a valid, non-expired, non-self-signed certificate on the origin. |
| F2 **BLOCKER** | Is the origin certificate currently valid, and when does it renew? | In Full (strict) an invalid origin cert takes the whole site down with a 526. |
| F3 | Will AutoSSL still be able to renew once Cloudflare is proxying? | Renewal needs `/.well-known/acme-challenge/` reachable. The `.htaccess` explicitly exempts that path — confirm the handler does not block it elsewhere. |
| F4 | Is there any HSTS already set at server level? | The site sends `max-age=31536000`. A conflicting or longer policy with `preload` would make rollback to HTTP impossible. |

## G. RSVP / event subsystem

| # | Ask for | Why it matters |
| --- | --- | --- |
| G1 **BLOCKER** | Database name, user, and current row count in `registrations` | Confirms the app is live data, not a leftover, before anything touches it. |
| G2 **BLOCKER** | Who has been using `host_view.php`, and is it still needed? | It is now blocked by default. If event staff rely on it, it needs re-opening behind Basic auth rather than staying denied. |
| G3 **BLOCKER** | How long was `host_view.php` publicly reachable, and are there access logs? | It exposed every registrant's name, email, phone and emergency contact with no authentication. Whether this is a notifiable data breach depends on the answer. Ask for the raw access logs for that path. |
| G4 | Is the August 2026 press conference definitely concluded? | Determines urgency on G2. |
| G5 | SMTP account used by the reminder script — is it still active? | The reminder cron will fail silently otherwise. |
| G6 | Is there a data retention policy for registrant records? | The table holds personal and emergency-contact data with no stated deletion date. |

## H. Third-party accounts

| # | Ask for | Why it matters |
| --- | --- | --- |
| H1 | Admin access to Google Tag Manager container `GTM-W333F6RK` | Hard-coded into all 23 pages in all three regions. You cannot change analytics without it. |
| H2 | The linked GA4 property and who owns it | The consent system deliberately leaves `analyticsId` empty because GA4 is expected to fire inside GTM. Confirm that is actually the case, or analytics is silently broken. |
| H3 | reCAPTCHA v3 site key **and** secret key | The contact and subscribe forms are currently non-functional — `form.js` still has `siteKey: "CHANGEME"`. |
| H4 | Which address should contact and subscribe form submissions go to? | `simple-forms/config.php` still contains the vendor placeholder `your-email@gmail.com`. |
| H5 | Is there an existing Cloudflare account for the company? | Better to add the domain to a company-owned account than create a personal one that becomes a single point of failure. |
| H6 | Google Search Console access | To watch for crawl errors after the URL and routing change. |

## I. Process and people

| # | Ask for | Why it matters |
| --- | --- | --- |
| I1 **BLOCKER** | Who deploys today, and how? | That workflow must stop at cutover, or manual uploads will fight the automated deploy. |
| I2 | An agreed maintenance window | The first deploy uploads ~63 MB and DNS propagation can take up to 24h. |
| I3 | Who is on call to roll back, and by what route? | Rollback is: revert nameservers at the registrar, and restore the `public_html` backup. |
| I4 | Any contractual or support obligation tied to the current setup? | Some hosts void support if deployment is automated externally. Worth knowing in advance. |

---

## Red flags — escalate immediately

If any of these turn out to be true, stop and reassess before touching DNS:

- **Apache 2.2, or PHP older than 8.1** — the ruleset and the RSVP portal will not run as written.
- **`AllowOverride` is not `All`** — `.htaccess` is being ignored and nothing here works.
- **`private_config/` sits inside the web root** — live database and SMTP credentials are publicly readable right now. Treat as an active incident.
- **Email is on the same cPanel and no one has the MX records** — do not change nameservers until they are captured.
- **Nobody knows what is in the current web root** — cutover will either destroy something or leave stale files shadowing the new site.
- **`host_view.php` access logs show unfamiliar traffic** — the PII exposure may have been used, not merely possible.
