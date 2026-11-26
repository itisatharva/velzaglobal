// Template markers shared by build-templates.mjs (Node build step) and render-article.mjs (any runtime).
// Kept free of Node imports so the renderer can be bundled into the Cloudflare Worker.
export const MARKERS = { seo: '<!--CMS:SEO-->', article: '<!--CMS:ARTICLE-->', related: '<!--CMS:RELATED-->', nav: '<!--CMS:NAV-->' };
