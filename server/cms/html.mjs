// HTML helpers for server-side CMS rendering. Runtime-agnostic (no Node APIs).

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes text for HTML element content and quoted attribute values. */
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Serialises data for a <script type="application/ld+json"> block without allowing "</script>" breakout. */
export const jsonLd = (data) => JSON.stringify(data, null, 2).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Calendar date of `date` in an IANA time zone (e.g. 'Asia/Kolkata'); UTC when none is given or it is unknown. */
const calendarDate = (date, timeZone) => {
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
      const get = (type) => Number(parts.find((p) => p.type === type).value);
      return { y: get('year'), m: get('month'), d: get('day') };
    } catch {
      // Unknown time zone: fall back to UTC.
    }
  }
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
};

/**
 * Returns { iso: 'YYYY-MM-DD', label: 'Sep 23, 2026' }, or null for invalid input.
 * Date-only values ("2026-10-27", Strapi `date` fields) keep their calendar date. Timestamps (Strapi `datetime`
 * fields, stored in UTC) give the calendar date in `timeZone` — the article region's zone — or in UTC without one.
 */
export const formatDate = (value, timeZone) => {
  if (!value) return null;
  let y; let m; let d;
  const dateOnly = typeof value === 'string' ? DATE_ONLY_RE.exec(value) : null;
  if (dateOnly) {
    [y, m, d] = dateOnly.slice(1).map(Number);
    const check = new Date(Date.UTC(y, m - 1, d));
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;
  } else {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    ({ y, m, d } = calendarDate(date, timeZone));
  }
  const dd = String(d).padStart(2, '0');
  return { iso: `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${dd}`, label: `${MONTHS[m - 1]} ${dd}, ${y}` };
};

/**
 * Returns a safe href or null. Allowed: http(s) URLs, mailto:, tel:, same-site paths ("/…") and fragments.
 * `external` is true for http(s) URLs on another origin.
 */
export const safeHref = (url, siteOrigin = '') => {
  if (typeof url !== 'string') return null;
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith('#')) return { href: u, external: false };
  if (u.startsWith('/') && !u.startsWith('//')) return { href: u, external: false };
  if (/^(mailto|tel):/i.test(u)) return { href: u, external: false };
  if (/^https?:\/\//i.test(u)) {
    let external = true;
    try { external = !siteOrigin || new URL(u).origin !== new URL(siteOrigin).origin; } catch { return null; }
    return { href: u, external };
  }
  return null;
};
