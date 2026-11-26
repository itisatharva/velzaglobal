// Renders Strapi 5 "Blocks" rich text to HTML matching the existing article markup.
// All text is escaped; links are restricted by safeHref; unknown block types are skipped.
import { esc, safeHref } from './html.mjs';

const renderInline = (nodes, ctx) => (Array.isArray(nodes) ? nodes : []).map((n) => {
  if (!n || typeof n !== 'object') return '';
  if (n.type === 'text') {
    let out = esc(n.text ?? '').replace(/\n/g, '<br />');
    if (n.code) out = `<code>${out}</code>`;
    if (n.bold) out = `<strong>${out}</strong>`;
    if (n.italic) out = `<em>${out}</em>`;
    if (n.underline) out = `<u>${out}</u>`;
    if (n.strikethrough) out = `<s>${out}</s>`;
    return out;
  }
  if (n.type === 'link') {
    const inner = renderInline(n.children, ctx);
    const link = safeHref(n.url, ctx.siteOrigin);
    if (!link) return inner; // unsafe or invalid URL: keep the text, drop the link
    const extra = link.external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${esc(link.href)}"${extra}>${inner}</a>`;
  }
  return '';
}).join('');

const plain = (nodes) => (Array.isArray(nodes) ? nodes : []).map((n) => {
  if (!n) return '';
  if (n.type === 'text') return n.text ?? '';
  return plain(n.children);
}).join('');

/** Markup used for article images, matching the static pages. */
export const articleImage = (src, alt) => `<img class="mt-6 mb-6" data-ds-anim="image-reveal" src="${esc(src)}" alt="${esc(alt)}" />`;

const renderList = (block, ctx) => {
  const tag = block.format === 'ordered' ? 'ol' : 'ul';
  const items = (block.children || []).map((child) => {
    if (child?.type === 'list') return renderList(child, ctx); // nested list
    return `<li>${renderInline(child?.children, ctx)}</li>`;
  }).join('');
  return `<${tag}>${items}</${tag}>`;
};

/** Renders one block, or '' for empty/unknown blocks. */
export const renderBlock = (block, ctx = {}) => {
  if (!block || typeof block !== 'object') return '';
  switch (block.type) {
    case 'paragraph': {
      const inner = renderInline(block.children, ctx);
      return inner.trim() ? `<p>${inner}</p>` : '';
    }
    case 'heading': {
      const inner = renderInline(block.children, ctx);
      if (!inner.trim()) return '';
      const level = Number(block.level) || 2;
      if (level <= 2) return `<h2 class="vg-look-h5">${inner}</h2>`; // h1 is reserved for the article title
      return `<h${Math.min(level, 6)}>${inner}</h${Math.min(level, 6)}>`;
    }
    case 'list':
      return renderList(block, ctx);
    case 'quote':
      return `<blockquote><p>${renderInline(block.children, ctx)}</p></blockquote>`;
    case 'code':
      return `<pre><code>${esc(plain(block.children))}</code></pre>`;
    case 'image': {
      const src = ctx.resolveMedia ? ctx.resolveMedia(block.image) : null;
      if (!src) return '';
      return articleImage(src, ctx.altFor ? ctx.altFor(block.image?.alternativeText) : block.image?.alternativeText || '');
    }
    default:
      return '';
  }
};

/** Renders a Blocks array. Returns an array of HTML strings (one per rendered block) so callers can interleave content. */
export const renderBlocks = (blocks, ctx = {}) => (Array.isArray(blocks) ? blocks : [])
  .map((b) => ({ type: b?.type, html: renderBlock(b, ctx) }))
  .filter((r) => r.html);

/** Plain text of a Blocks array (for JSON-LD answers and fallbacks). */
export const blocksToText = (blocks) => (Array.isArray(blocks) ? blocks : []).map((b) => plain(b?.children)).filter(Boolean).join('\n');
