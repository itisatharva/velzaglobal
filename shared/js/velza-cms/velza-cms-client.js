/**
 * Velza CMS client — dependency-free ES module for reading published content from the
 * Velza Strapi 5 REST API. Works in modern browsers and Node.js 18+ (global fetch).
 *
 * Scope (Phase 7A): read-only Content API access only. It does not decide any pending
 * Phase 6 business rule — in particular it does NOT hide expired news (F2) or future-dated
 * items (F3); those stay pending business sign-off.
 *
 * Tokens: never ship an API token to browsers. In browser code, call the API without a token
 * and rely on the Public role's find/findOne permissions. Use a read-only token only from
 * server-side code.
 */

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 100; // config/api.ts rest.maxLimit

/** Error raised for every failed request. `kind` is one of: network, timeout, http, parse, config. */
export class CmsError extends Error {
  constructor(message, { kind, status = null, details = null } = {}) {
    super(message);
    this.name = 'CmsError';
    this.kind = kind;
    this.status = status;
    this.details = details;
  }
}

// Populate trees per content type, matching the velza-cms schemas.
const IMAGE = true;
const SEO = { populate: { shareImage: IMAGE } };
const POPULATE = {
  blogs: {
    featuredImage: IMAGE,
    gallery: IMAGE,
    author: { populate: { avatar: IMAGE } },
    category: true,
    regions: true,
    seo: SEO,
    faqs: true,
  },
  'news-articles': {
    featuredImage: IMAGE,
    author: { populate: { avatar: IMAGE } },
    category: true,
    regions: true,
    seo: SEO,
  },
  'newsletter-issues': {
    coverImage: IMAGE,
    regions: true,
    seo: SEO,
  },
  authors: { avatar: IMAGE },
  categories: null,
  regions: null,
};

// Default sort per type (newest first where a publication date exists).
const DEFAULT_SORT = {
  blogs: ['publicationDate:desc'],
  'news-articles': ['publicationDate:desc'],
  'newsletter-issues': ['publicationDate:desc'],
  authors: ['name:asc'],
  categories: ['name:asc'],
  regions: ['name:asc'],
};

// Types that have a many-to-many `regions` relation.
const REGIONAL = new Set(['blogs', 'news-articles', 'newsletter-issues']);

/**
 * Encodes a nested object as Strapi/qs-style bracket parameters,
 * e.g. { filters: { slug: { $eq: 'a' } } } -> "filters[slug][$eq]=a".
 */
export const encodeQuery = (params) => {
  const parts = [];
  const walk = (value, prefix) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${prefix}[${i}]`));
    } else if (typeof value === 'object') {
      for (const [key, inner] of Object.entries(value)) walk(inner, prefix ? `${prefix}[${key}]` : key);
    } else {
      parts.push(`${encodeURIComponent(prefix).replace(/%5B/g, '[').replace(/%5D/g, ']')}=${encodeURIComponent(String(value))}`);
    }
  };
  walk(params, '');
  return parts.join('&');
};

const clampPageSize = (size) => {
  const n = Number.isInteger(size) ? size : DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(n, 1), MAX_PAGE_SIZE);
};

/** Builds the query object for a collection request. Exported for testing. */
// `fields` (top-level attributes) and `populate` override the defaults so a caller that needs only a few
// values (e.g. listing cards) does not download every article body. Omitted = full default populate.
export const buildQuery = (type, { region, slug, page = 1, pageSize, sort, extraFilters, fields, populate } = {}) => {
  const filters = { ...(extraFilters || {}) };
  if (slug) filters.slug = { $eq: slug };
  if (region) {
    if (!REGIONAL.has(type)) throw new CmsError(`Content type "${type}" has no regions relation`, { kind: 'config' });
    filters.regions = { slug: { $eq: region } };
  }
  const query = {
    sort: sort || DEFAULT_SORT[type],
    pagination: { page: Number.isInteger(page) && page > 0 ? page : 1, pageSize: clampPageSize(pageSize) },
  };
  if (Object.keys(filters).length) query.filters = filters;
  if (Array.isArray(fields) && fields.length) query.fields = fields;
  const tree = populate === undefined ? POPULATE[type] : populate;
  if (tree) query.populate = tree;
  return query;
};

/**
 * Resolves a Strapi media object (or null) to an absolute URL.
 * Relative "/uploads/..." URLs are prefixed with mediaBaseUrl; absolute URLs are returned as-is.
 * `format` picks a responsive variant (thumbnail, small, medium, large) and falls back to the original.
 * Returns null for missing media so callers can render a placeholder.
 */
export const mediaUrl = (media, { mediaBaseUrl = '', format } = {}) => {
  if (!media || typeof media !== 'object') return null;
  const variant = format && media.formats && media.formats[format];
  const url = (variant && variant.url) || media.url;
  if (!url || typeof url !== 'string') return null;
  if (/^https?:\/\//i.test(url)) return url;
  // Reject any other scheme (javascript:, data:, …) and protocol-relative URLs.
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) return null;
  return `${mediaBaseUrl.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
};

/**
 * Creates a client.
 * @param {object} options
 * @param {string} options.baseUrl       CMS origin, e.g. "http://127.0.0.1:1337" (placeholder until confirmed).
 * @param {string} [options.mediaBaseUrl] Origin for relative media URLs; defaults to baseUrl.
 * @param {string} [options.token]       Read-only API token — server-side use only.
 * @param {Function} [options.fetch]     fetch implementation (defaults to global fetch).
 * @param {number} [options.timeoutMs]   Per-request timeout.
 */
export const createVelzaCmsClient = ({ baseUrl, mediaBaseUrl, token, fetch: fetchImpl, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
    throw new CmsError('baseUrl must be an absolute http(s) URL', { kind: 'config' });
  }
  // Refuse to use a token in a browser: anything shipped to a browser is public.
  if (token && typeof window !== 'undefined' && typeof document !== 'undefined') {
    throw new CmsError('API tokens must not be used in browser code; use the Public role instead', { kind: 'config' });
  }
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  if (!doFetch) throw new CmsError('No fetch implementation available', { kind: 'config' });

  const origin = baseUrl.replace(/\/+$/, '');
  const mediaOrigin = (mediaBaseUrl || origin).replace(/\/+$/, '');

  const request = async (path, query) => {
    const qs = query ? encodeQuery(query) : '';
    const url = `${origin}/api/${path}${qs ? `?${qs}` : ''}`;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    // The timeout covers the whole exchange: headers AND body. A response whose body stalls after the
    // headers arrive must not leave a listing busy (or a Worker request hanging) indefinitely.
    let timedOut = false;
    let timer = null;
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        if (controller) controller.abort();
        reject(new CmsError(`Request timed out after ${timeoutMs} ms`, { kind: 'timeout' }));
      }, timeoutMs);
    });
    deadline.catch(() => {}); // handled by the races below; avoids an unhandled rejection after success
    let res;
    let body = null;
    try {
      try {
        res = await Promise.race([
          doFetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            signal: controller ? controller.signal : undefined,
          }),
          deadline,
        ]);
      } catch (err) {
        if (timedOut || (err && err.name === 'AbortError')) throw new CmsError(`Request timed out after ${timeoutMs} ms`, { kind: 'timeout' });
        throw new CmsError('Network error while contacting the CMS', { kind: 'network', details: err && err.message });
      }
      try {
        body = await Promise.race([res.json(), deadline]);
      } catch (err) {
        if (timedOut) throw new CmsError(`Request timed out after ${timeoutMs} ms`, { kind: 'timeout' });
        if (res.ok) throw new CmsError('CMS returned a non-JSON response', { kind: 'parse', status: res.status });
      }
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      const message = (body && body.error && body.error.message) || `CMS request failed with HTTP ${res.status}`;
      throw new CmsError(message, { kind: 'http', status: res.status, details: body && body.error ? body.error : null });
    }
    return body;
  };

  const list = async (type, options = {}) => {
    const body = await request(type, buildQuery(type, options));
    const items = Array.isArray(body && body.data) ? body.data : [];
    const p = (body && body.meta && body.meta.pagination) || {};
    return {
      items,
      pagination: {
        page: p.page ?? 1,
        pageSize: p.pageSize ?? items.length,
        pageCount: p.pageCount ?? 1,
        total: p.total ?? items.length,
      },
    };
  };

  // Slug lookup uses the collection endpoint with a slug filter (the REST findOne route takes a documentId).
  const getBySlug = async (type, slug, { region } = {}) => {
    if (!slug) throw new CmsError('slug is required', { kind: 'config' });
    const { items } = await list(type, { slug, region, page: 1, pageSize: 1 });
    return items[0] || null;
  };

  return {
    listBlogs: (o) => list('blogs', o),
    getBlogBySlug: (slug, o) => getBySlug('blogs', slug, o),
    listNewsArticles: (o) => list('news-articles', o),
    getNewsArticleBySlug: (slug, o) => getBySlug('news-articles', slug, o),
    listNewsletterIssues: (o) => list('newsletter-issues', o),
    getNewsletterIssueBySlug: (slug, o) => getBySlug('newsletter-issues', slug, o),
    listAuthors: (o) => list('authors', o),
    listCategories: (o) => list('categories', o),
    listRegions: (o) => list('regions', o),
    mediaUrl: (media, o = {}) => mediaUrl(media, { mediaBaseUrl: mediaOrigin, ...o }),
  };
};
