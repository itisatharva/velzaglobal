/**
 * Velza CMS — blog and news listing progressive enhancement.
 *
 * Targets elements marked `data-cms="blog-list"` or `data-cms="news-list"` plus
 * `data-cms-region="<hk|ph|in>"`, which already hold the static cards. When the CMS is configured and
 * returns published entries for the region, the static cards are replaced with CMS cards built from the
 * same markup classes. Otherwise the static cards stay (see cmsConfig.fallbackToStatic).
 * No token is used: browsers rely on the CMS Public role.
 *
 * Detail links: only CMS entries whose /blogs/<slug> or /news/<slug> URL is already linked by the page's own
 * static cards (i.e. a static detail page is known to exist) are rendered as links. Other CMS entries render
 * without a link, so visitors are never sent to a missing page. A CMS-backed detail route is pending the
 * URL/canonical decisions (Phase 6 F4b/F4c).
 * News expiry and future-date embargo are NOT applied (pending Phase 6 F2/F3).
 */
import { createVelzaCmsClient } from './velza-cms-client.js';
import { cmsConfig } from './cms-config.js';

/** Listing kinds supported on the site. */
export const LISTINGS = {
  'blog-list': { method: 'listBlogs', path: '/blogs/', empty: 'No articles have been published yet.', error: 'Articles could not be loaded right now. Please try again later.' },
  'news-list': { method: 'listNewsArticles', path: '/news/', empty: 'No news has been published yet.', error: 'News could not be loaded right now. Please try again later.' },
};

/** Maps a Strapi 5 entry to the values a card needs. Pure; exported for tests. */
export const toCardModel = (item, resolveMedia, { placeholderImage, imageFormat } = {}, basePath = '/blogs/') => {
  const title = typeof item?.title === 'string' ? item.title.trim() : '';
  const slug = typeof item?.slug === 'string' ? item.slug : '';
  if (!title || !slug) return null; // skip malformed entries rather than render a broken card
  const image = resolveMedia(item.featuredImage, { format: imageFormat });
  return {
    href: `${basePath}${encodeURIComponent(slug)}`,
    title: title.toUpperCase(), // the static cards use upper-case titles
    imageSrc: image || placeholderImage || null,
    imageAlt: (item.featuredImage && item.featuredImage.alternativeText) || title,
    usedPlaceholder: !image,
  };
};

/** Normalises a same-site detail href for comparison ("/blogs/x/", "/blogs/x.html" -> "/blogs/x"). */
export const normalizeDetailHref = (href) => {
  if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return null;
  return href.split(/[?#]/)[0].replace(/\.html?$/i, '').replace(/\/+$/, '');
};

/** Detail URLs the page's static cards already link to — the only detail pages known to exist. */
export const collectKnownDetailHrefs = (container, basePath) => new Set(
  Array.from(container.querySelectorAll('a[href]'))
    .map((a) => normalizeDetailHref(a.getAttribute('href')))
    .filter((href) => href && href.startsWith(basePath) && href.length > basePath.length),
);

/** Decides what to show. Pure; returns 'cards' | 'keep-static' | 'empty' | 'error'. */
export const decideView = ({ models, error, fallbackToStatic }) => {
  if (error) return fallbackToStatic ? 'keep-static' : 'error';
  if (!models.length) return fallbackToStatic ? 'keep-static' : 'empty';
  return 'cards';
};

const el = (doc, tag, className, attrs = {}) => {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

/**
 * Builds one card with the static markup's structure and classes (without the theme's hidden fade-in class).
 * When `model.linked` is false there is no known detail page: the image and title are rendered without links
 * (plain, non-focusable content) instead of pointing at a missing page.
 */
export const buildCard = (doc, model) => {
  const wrapper = el(doc, 'div', model.linked ? 'sk__blog-article-wrapper vg-cms-card' : 'sk__blog-article-wrapper vg-cms-card vg-cms-card--no-detail');
  const magazine = el(doc, 'div', 'sk__article-magazine');
  const article = el(doc, 'article', 'post type-post format-standard has-post-thumbnail hentry');

  const imageBox = el(doc, 'div', 'post-image');
  const imageInner = el(doc, 'div', 'post-image-inner');
  const image = model.imageSrc
    ? el(doc, 'img', 'sk__in-content-post-image', { src: model.imageSrc, alt: model.imageAlt, loading: 'lazy' })
    : null;
  if (model.linked) {
    const imageLink = el(doc, 'a', null, { href: model.href });
    if (image) imageLink.appendChild(image);
    imageInner.appendChild(imageLink);
  } else if (image) {
    imageInner.appendChild(image);
  }
  imageBox.appendChild(imageInner);

  const info = el(doc, 'div', 'sk__post-info py-4');
  const header = el(doc, 'header', 'entry-header');
  const h3 = el(doc, 'h3', 'entry-title narrow gradient-links-bright vg-look-h4');
  const title = model.linked ? el(doc, 'a', null, { href: model.href, rel: 'bookmark' }) : el(doc, 'span', 'vg-cms-title');
  title.textContent = model.title; // textContent: CMS text is never parsed as HTML
  h3.appendChild(title);
  header.appendChild(h3);
  info.appendChild(header);

  article.append(imageBox, info);
  magazine.appendChild(article);
  wrapper.appendChild(magazine);
  return wrapper;
};

const showMessage = (doc, container, text) => {
  const p = el(doc, 'p', 'vg-cms-message', { role: 'status' });
  p.textContent = text;
  container.replaceChildren(p);
};

/** Enhances every marked listing in `doc`. Returns a summary per container (used by tests and logs). */
export const enhanceListings = async (doc = document, config = cmsConfig, createClient = createVelzaCmsClient) => {
  const selector = Object.keys(LISTINGS).map((k) => `[data-cms="${k}"]`).join(',');
  const results = [];
  for (const container of Array.from(doc.querySelectorAll(selector))) {
    const kind = container.getAttribute('data-cms');
    const listing = LISTINGS[kind];
    const siteRegion = container.getAttribute('data-cms-region');
    const regionSlug = config.regionSlugs && config.regionSlugs[siteRegion];
    if (!config.baseUrl || !regionSlug) {
      results.push({ kind, region: siteRegion, view: 'keep-static', reason: !config.baseUrl ? 'cms-disabled' : 'region-unmapped' });
      continue;
    }

    // Read the static cards' links before anything is replaced.
    const knownDetails = collectKnownDetailHrefs(container, listing.path);
    container.setAttribute('aria-busy', 'true');
    container.classList.add('vg-cms-loading');
    let models = [];
    let error = null;
    try {
      const client = createClient({ baseUrl: config.baseUrl, mediaBaseUrl: config.mediaBaseUrl, timeoutMs: config.timeoutMs });
      const { items } = await client[listing.method]({ region: regionSlug, pageSize: config.pageSize });
      models = items
        .map((item) => toCardModel(item, client.mediaUrl, config, listing.path))
        .filter(Boolean)
        .map((m) => ({ ...m, linked: knownDetails.has(normalizeDetailHref(m.href)) }));
    } catch (e) {
      error = e;
    }

    const view = decideView({ models, error, fallbackToStatic: config.fallbackToStatic !== false });
    if (view === 'cards') container.replaceChildren(...models.map((m) => buildCard(doc, m)));
    else if (view === 'empty') showMessage(doc, container, listing.empty);
    else if (view === 'error') showMessage(doc, container, listing.error);
    container.removeAttribute('aria-busy');
    container.classList.remove('vg-cms-loading');
    container.setAttribute('data-cms-state', view);
    if (error && typeof console !== 'undefined') console.warn(`[velza-cms] ${kind} kept static content:`, error.kind || '', error.message);
    results.push({ kind, region: siteRegion, view, count: models.length, linked: models.filter((m) => m.linked).length, error: error ? error.kind : null });
  }
  return results;
};

// Auto-run in browsers (module scripts execute after the document is parsed).
if (typeof document !== 'undefined' && !globalThis.__VELZA_CMS_NO_AUTORUN__) {
  enhanceListings().then((r) => { globalThis.__velzaCmsListings = r; });
}
