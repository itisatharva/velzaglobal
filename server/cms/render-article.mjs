// Server-side renderer for CMS-managed Blog and News article pages.
//
// Runtime-agnostic (global fetch only): usable from a Cloudflare Worker, a static-generation step or
// the local dev server. It returns a status and full HTML; the caller serves its own 404/503 page when
// `body` is null. Templates come from build-templates.mjs (exact shell of the live article pages).
//
// Rules enforced here:
//   - published entries only (the Content API never returns drafts; publishedAt is re-checked);
//   - strict regional isolation (the query filters by region and the result is re-checked);
//   - unknown/unpublished/deleted/other-region slugs -> 404; CMS failure -> 503 (never stale content);
//   - all CMS text is escaped; links are sanitised; JSON-LD cannot break out of its <script>.
// Not applied (pending Phase 6): news expiry (F2), future-date embargo (F3), slug redirects.
import { createVelzaCmsClient, CmsError } from '../../shared/js/velza-cms/velza-cms-client.js';
import { renderBlocks, blocksToText, articleImage } from './blocks.mjs';
import { esc, jsonLd, formatDate } from './html.mjs';
import { MARKERS } from './markers.mjs';

export const TYPES = {
  blogs: { label: 'Blog', listLabel: 'Blogs', schemaType: 'Article', get: 'getBlogBySlug', list: 'listBlogs', path: '/blogs', lead: 'excerpt', faqs: true },
  news: { label: 'News', listLabel: 'News', schemaType: 'NewsArticle', get: 'getNewsArticleBySlug', list: 'listNewsArticles', path: '/news', lead: 'summary', faqs: false },
};

export const DEFAULTS = {
  timeoutMs: 8000,
  relatedCount: 3,
  // PLACEHOLDER: the existing static pages use https://www.velzaglobal.com; confirm with the F4b decision.
  siteOrigin: null,
  localeByRegion: { hk: 'en_HK', in: 'en_IN', ph: 'en_PH' },
  // Publication dates are shown as the calendar date in the page region's time zone (CMS timestamps are UTC).
  timeZoneByRegion: { hk: 'Asia/Hong_Kong', in: 'Asia/Kolkata', ph: 'Asia/Manila' },
  regionNames: { hk: 'Hong Kong', in: 'India', ph: 'Philippines' },
  placeholderImage: '/shared/images/blog-hero-banner.webp',
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  organisation: { name: 'Velza Global Group', logo: '/shared/images/logo-normal.png' },
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTML_HEADERS = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-cache, must-revalidate' };

const abs = (origin, path) => (origin ? `${origin.replace(/\/+$/, '')}${path}` : path);
const absMedia = (origin, url) => (!url ? null : /^https?:\/\//i.test(url) ? url : abs(origin, url));

/** Builds the <head> "SEO / Social Metadata" block. Pure. */
export const buildSeo = ({ entry, type, region, cfg, pageUrl, images, faqs }) => {
  const t = TYPES[type];
  const seo = entry.seo || {};
  const lead = entry[t.lead] || '';
  const description = seo.metaDescription || lead;
  const baseTitle = seo.metaTitle || entry.title;
  const titleTag = /velza global/i.test(baseTitle) ? baseTitle : `${baseTitle} | Velza Global`;
  // Editor-supplied canonical URLs must be absolute http(s); anything else (javascript:, relative, ...) is ignored.
  const canonical = /^https?:\/\/[^\s"'<>]+$/i.test(seo.canonicalUrl || '') ? seo.canonicalUrl : pageUrl;
  const ogTitle = seo.ogTitle || baseTitle;
  const ogDescription = seo.ogDescription || description;
  const shareImage = images.share || images.featured;
  const timeZone = cfg.timeZoneByRegion?.[region];
  const published = formatDate(entry.publicationDate, timeZone);
  const modified = formatDate(entry.updatedAt, timeZone) || published;
  const author = entry.author?.name
    ? { '@type': 'Person', name: entry.author.name }
    : { '@type': 'Organization', name: cfg.organisation.name, url: abs(cfg.siteOrigin, '/') };

  const graph = [
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: abs(cfg.siteOrigin, '/') },
        { '@type': 'ListItem', position: 2, name: t.listLabel, item: abs(cfg.siteOrigin, t.path) },
        { '@type': 'ListItem', position: 3, name: entry.title, item: pageUrl },
      ],
    },
    {
      '@type': t.schemaType,
      '@id': `${pageUrl}#article`,
      mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
      headline: entry.title,
      description,
      ...(images.all.length ? { image: images.all } : {}),
      ...(published ? { datePublished: published.iso, dateModified: (modified || published).iso } : {}),
      ...(entry.category?.name ? { articleSection: entry.category.name } : {}),
      author,
      publisher: {
        '@type': 'Organization',
        name: cfg.organisation.name,
        url: abs(cfg.siteOrigin, '/'),
        logo: { '@type': 'ImageObject', url: abs(cfg.siteOrigin, cfg.organisation.logo) },
      },
    },
  ];
  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: blocksToText(f.answer) } })),
    });
  }

  const m = (attr, key, value) => (value ? `        <meta ${attr}="${key}" content="${esc(value)}" />\n` : '');
  return '\n' +
    m('name', 'description', description) +
    m('name', 'author', entry.author?.name || cfg.organisation.name) +
    m('name', 'robots', seo.noIndex ? 'noindex, follow' : cfg.robots) +
    `\n        <title>${esc(titleTag)}</title>\n` +
    (canonical ? `        <link rel="canonical" href="${esc(canonical)}" />\n` : '') +
    '\n' +
    m('property', 'og:type', 'article') +
    m('property', 'og:site_name', cfg.organisation.name) +
    m('property', 'og:locale', cfg.localeByRegion[region]) +
    m('property', 'og:title', ogTitle) +
    m('property', 'og:description', ogDescription) +
    m('property', 'og:url', canonical) +
    m('property', 'og:image', shareImage?.url) +
    m('property', 'og:image:alt', shareImage?.alt) +
    m('property', 'article:published_time', entry.publicationDate ? new Date(entry.publicationDate).toISOString() : null) +
    m('property', 'article:modified_time', entry.updatedAt ? new Date(entry.updatedAt).toISOString() : null) +
    '\n' +
    m('name', 'twitter:card', 'summary_large_image') +
    m('name', 'twitter:title', ogTitle) +
    m('name', 'twitter:description', ogDescription) +
    m('name', 'twitter:image', shareImage?.url) +
    `\n        <script type="application/ld+json">\n${jsonLd({ '@context': 'https://schema.org', '@graph': graph })}\n        </script>\n        `;
};

const faqHtml = (faqs, ctx) => {
  if (!faqs.length) return '';
  const items = faqs.map((f) => {
    const answer = renderBlocks(f.answer, ctx).map((r) => r.html).join('');
    return `<div class="sk__faq-item">
<h3 class="sk__faq-heading"><button class="sk__faq-toggle" type="button" aria-expanded="false">
<span class="sk__faq-bullet" aria-hidden="true"></span>
<span class="sk__faq-question">${esc(f.question)}</span>
<span class="sk__faq-icon" aria-hidden="true"></span>
</button></h3>
<div class="sk__faq-answer"><div class="sk__faq-answer-inner">${answer}</div></div>
</div>`;
  }).join('\n');
  return `<div class="sk__faq-accordion" data-ds-stagger="fade-up" data-ds-items=".sk__faq-item" data-ds-each="0.08">\n${items}\n</div>`;
};

/** Builds the inner HTML of <div class="post-content pb-5">. Pure. */
export const buildArticleBody = ({ entry, type, ctx, images, faqs }) => {
  const date = formatDate(entry.publicationDate, ctx?.timeZone);
  const parts = [];
  if (date) parts.push(`<p class="post-date"><time datetime="${date.iso}">${date.label}</time></p>`);
  parts.push(`<h1 class="h2-large"><strong>${esc(String(entry.title).toUpperCase())}</strong></h1>`);

  const blocks = renderBlocks(entry.content, ctx);
  const featured = images.featured ? articleImage(images.featured.url, images.featured.alt) : '';
  // Like the static pages, the main image follows the first paragraph (or the title if there is none).
  const firstParagraph = blocks.findIndex((b) => b.type === 'paragraph');
  blocks.forEach((b, i) => {
    parts.push(b.html);
    if (i === firstParagraph && featured) parts.push(featured);
  });
  if (firstParagraph === -1 && featured) parts.splice(2, 0, featured);

  for (const g of images.gallery) parts.push(articleImage(g.url, g.alt));
  if (TYPES[type].faqs) {
    const faq = faqHtml(faqs, ctx);
    if (faq) parts.push(faq);
  }
  if (type === 'news' && entry.sourceName) {
    const src = ctx.safeSource;
    parts.push(src
      ? `<p class="vg-cms-source">Source: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(entry.sourceName)}</a></p>`
      : `<p class="vg-cms-source">Source: ${esc(entry.sourceName)}</p>`);
  }
  parts.push('<a class="btn btn-outline-light mt-3" href="/contact-us" role="button">Contact Us</a>');
  return `\n${parts.join('\n')}\n`;
};

/** Builds the "Related Articles" section, or '' when there is nothing to show. Pure. */
export const buildRelated = (cards) => {
  if (!cards.length) return '';
  const items = cards.map((c) => `<a class="vg-related-card" href="${esc(c.href)}">
<img src="${esc(c.image)}" alt="" loading="lazy" decoding="async" />
<span class="vg-related-meta">${esc(c.label)}${c.date ? ` &middot; ${esc(c.date)}` : ''}</span>
<h3 class="vg-related-title">${esc(c.title)}</h3>
</a>`).join('\n');
  return `<section class="vg-related" aria-labelledby="vg-related-heading">
<div class="container sk__supercontainer">
<div class="vg-related-inner">
<h2 id="vg-related-heading" class="vg-look-h5">Related Articles</h2>
<div class="vg-related-grid">
${items}
</div>
</div>
</div>
</section>`;
};

/** Builds the article navigation: a "back to listing" link in the existing markup. Pure. */
export const buildNav = (type) => {
  const t = TYPES[type];
  const upper = t.listLabel.toUpperCase();
  return `<section class="article-navigation sk__py-s">
<div class="container sk__supercontainer">
<div class="article-nav-wrap" data-ds-anim="fade-up">
<a href="${t.path}" class="article-nav article-prev">
<span class="article-label">
<i class="fas fa-arrow-left"></i>
BACK TO ${upper}
</span>
<span class="article-nav-title">All Velza Global ${t.listLabel}</span>
</a>
</div>
</div>
</section>`;
};

const belongsToRegion = (entry, regionSlug) => Array.isArray(entry?.regions) && entry.regions.some((r) => r && r.slug === regionSlug);

/**
 * Renders a CMS article page.
 * @returns {Promise<{status:number, headers:object, body:string|null, reason?:string}>}
 */
export const renderArticle = async ({ type, slug, region, template, config, fetch: fetchImpl }) => {
  const cfg = { ...DEFAULTS, ...config, localeByRegion: { ...DEFAULTS.localeByRegion, ...config?.localeByRegion }, regionNames: { ...DEFAULTS.regionNames, ...config?.regionNames }, organisation: { ...DEFAULTS.organisation, ...config?.organisation } };
  const t = TYPES[type];
  const regionSlug = cfg.regionSlugs?.[region];
  const notFound = (reason) => ({ status: 404, headers: { ...HTML_HEADERS }, body: null, reason });
  if (!t || typeof slug !== 'string' || !SLUG_RE.test(slug)) return notFound('invalid-path');
  if (!cfg.baseUrl || !regionSlug) return notFound(!cfg.baseUrl ? 'cms-disabled' : 'region-unmapped');
  if (typeof template !== 'string' || !Object.values(MARKERS).every((mk) => template.includes(mk))) {
    return { status: 500, headers: { ...HTML_HEADERS }, body: null, reason: 'template-invalid' };
  }

  const client = createVelzaCmsClient({ baseUrl: cfg.baseUrl, mediaBaseUrl: cfg.mediaBaseUrl, token: cfg.token, timeoutMs: cfg.timeoutMs, fetch: fetchImpl });
  let entry;
  try {
    entry = await client[t.get](slug, { region: regionSlug });
  } catch (e) {
    return { status: 503, headers: { ...HTML_HEADERS, 'Retry-After': '60' }, body: null, reason: e instanceof CmsError ? `cms-${e.kind}` : 'cms-error' };
  }
  if (!entry || entry.slug !== slug || !entry.publishedAt || !belongsToRegion(entry, regionSlug)) return notFound('not-found');

  const regionName = cfg.regionNames[region] || region.toUpperCase();
  const altFor = (alt) => `${alt || entry.title} - Velza Global ${regionName}`;
  const resolve = (media) => absMedia(cfg.siteOrigin, client.mediaUrl(media));
  const mediaInfo = (media) => {
    const url = resolve(media);
    return url ? { url, alt: altFor(media.alternativeText) } : null;
  };
  const featured = mediaInfo(entry.featuredImage || entry.coverImage);
  const gallery = (Array.isArray(entry.gallery) ? entry.gallery : []).map(mediaInfo).filter(Boolean);
  const share = mediaInfo(entry.seo?.shareImage);
  const images = { featured, gallery, share, all: [featured, ...gallery].filter(Boolean).map((i) => i.url) };
  const faqs = (Array.isArray(entry.faqs) ? entry.faqs : []).filter((f) => f && f.question && Array.isArray(f.answer));
  const pageUrl = abs(cfg.siteOrigin, `${t.path}/${slug}`);
  const timeZone = cfg.timeZoneByRegion?.[region];
  const ctx = {
    siteOrigin: cfg.siteOrigin,
    timeZone,
    resolveMedia: resolve,
    altFor,
    safeSource: /^https?:\/\//i.test(entry.sourceUrl || '') ? entry.sourceUrl : null,
  };

  // Related: newest published entries of both types in the same region, excluding this one.
  let relatedCards = [];
  try {
    const [blogs, news] = await Promise.all([
      client.listBlogs({ region: regionSlug, pageSize: cfg.relatedCount + 1 }),
      client.listNewsArticles({ region: regionSlug, pageSize: cfg.relatedCount + 1 }),
    ]);
    relatedCards = [...blogs.items.map((e) => ['blogs', e]), ...news.items.map((e) => ['news', e])]
      .filter(([ty, e]) => e?.slug && e?.title && e.publishedAt && belongsToRegion(e, regionSlug) && !(ty === type && e.slug === slug))
      .sort((a, b) => String(b[1].publicationDate || '').localeCompare(String(a[1].publicationDate || '')))
      .slice(0, cfg.relatedCount)
      .map(([ty, e]) => ({
        href: `${TYPES[ty].path}/${encodeURIComponent(e.slug)}`,
        title: e.title,
        label: TYPES[ty].label,
        date: formatDate(e.publicationDate, timeZone)?.label,
        image: client.mediaUrl(e.featuredImage, { format: 'medium' }) || cfg.placeholderImage,
      }));
  } catch {
    relatedCards = []; // related articles are optional; never fail the page for them
  }

  const body = template
    .replace(MARKERS.seo, () => buildSeo({ entry, type, region, cfg, pageUrl, images, faqs }))
    .replace(MARKERS.article, () => buildArticleBody({ entry, type, ctx, images, faqs }))
    .replace(MARKERS.related, () => buildRelated(relatedCards))
    .replace(MARKERS.nav, () => buildNav(type));
  return { status: 200, headers: { ...HTML_HEADERS }, body };
};
