// Velza CMS integration settings for the website.
// DISABLED BY DEFAULT: while baseUrl is null, pages keep their existing static content.
// Every value marked PLACEHOLDER is unconfirmed. Never add an API token here — this file is public.

export const cmsConfig = {
  // PLACEHOLDER: the confirmed HTTPS origin of the hosted CMS (no hosted CMS exists yet).
  baseUrl: null,
  // Origin for relative /uploads media URLs; defaults to baseUrl when undefined.
  mediaBaseUrl: undefined,
  timeoutMs: 8000,
  pageSize: 12,
  imageFormat: 'medium',
  // Existing site image used when a CMS item has no usable featured image.
  placeholderImage: '/shared/images/blog-hero-banner.webp',
  // true: if the CMS is unreachable or returns no items, keep the page's static cards (no visible change).
  // false: show the empty / error messages instead.
  fallbackToStatic: true,
  // PLACEHOLDER: CMS region slugs for each site region (pending business decision F6a).
  // A null entry keeps that region's static content.
  regionSlugs: { hk: null, ph: null, in: null },
};
