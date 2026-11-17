// Velza CMS integration settings for the website.
// DISABLED BY DEFAULT: while baseUrl is null, pages keep their existing static content.
// Every value marked PLACEHOLDER is unconfirmed. Never add an API token here — this file is public.
//
// Environments are chosen by the page's hostname (one static file serves every environment; there is no build step).
//  - Only the hosts listed below can ever enable the CMS, and only with an https:// origin. Any other host
//    (localhost, previews, unknown domains) keeps the CMS disabled, so production can never point at a local or
//    plain-http CMS by accident.
//  - Local development does NOT edit this file: integration/tools/dev-site-server.mjs (DEV_CMS_URL) serves its own
//    in-memory config for localhost.
//  - After changing a value here, bump the ?v= version in content-listing.js and on the six listing pages' script
//    tags (see docs/frontend/FRONTEND_CMS_ENVIRONMENT_SETUP.md), or returning visitors keep the cached copy.

/** Per-host CMS origins. PLACEHOLDERS: no hosted CMS URL has been confirmed by the backend team yet. */
export const CMS_ENVIRONMENTS = {
  // PRODUCTION website (canonical host). PLACEHOLDER: the confirmed https origin of the production CMS.
  'www.velzaglobal.com': { baseUrl: null, mediaBaseUrl: undefined },
  // STAGING website (DEPLOY.md "staging.velzaglobal.com"). PLACEHOLDER: the confirmed https origin of the staging CMS.
  'staging.velzaglobal.com': { baseUrl: null, mediaBaseUrl: undefined },
};

const httpsOrigin = (value) => (typeof value === 'string' && /^https:\/\/[^/?#\s]+$/i.test(value.replace(/\/+$/, ''))
  ? value.replace(/\/+$/, '')
  : null);

/** Picks the CMS origins for a hostname. Pure; exported for tests. Unknown host or non-https value → disabled. */
export const selectCmsEnvironment = (hostname, environments = CMS_ENVIRONMENTS) => {
  const env = (typeof hostname === 'string' && environments[hostname.toLowerCase()]) || null;
  const baseUrl = env ? httpsOrigin(env.baseUrl) : null;
  const media = env && env.mediaBaseUrl !== undefined ? httpsOrigin(env.mediaBaseUrl) : undefined;
  return { baseUrl, mediaBaseUrl: baseUrl ? (media || undefined) : undefined };
};

const currentHost = typeof location !== 'undefined' && location ? location.hostname : '';
const selected = selectCmsEnvironment(currentHost);

export const cmsConfig = {
  // Selected per host above; null = CMS disabled (static content only).
  baseUrl: selected.baseUrl,
  // Origin for relative /uploads media URLs; defaults to baseUrl when undefined.
  mediaBaseUrl: selected.mediaBaseUrl,
  timeoutMs: 8000,
  pageSize: 12,
  imageFormat: 'medium',
  // Existing site image used when a CMS item has no usable featured image.
  placeholderImage: '/shared/images/blog-hero-banner.webp',
  // true: if the CMS is unreachable or returns no items, keep the page's static cards (no visible change).
  // false: show the empty / error messages instead.
  fallbackToStatic: true,
  // 'merge': CMS cards are added before the static cards (a CMS entry replaces the static card with the same URL).
  // 'replace': CMS cards only.
  listingMode: 'merge',
  // true only once server-rendered CMS article pages are deployed (server/cms). Until then, CMS cards link only
  // to detail pages that already exist as static files.
  detailPages: false,
  // PLACEHOLDER: CMS region slugs for each site region (pending business decision F6a).
  // A null entry keeps that region's static content.
  regionSlugs: { hk: 'hk', ph: 'ph', in: 'in' },
};
