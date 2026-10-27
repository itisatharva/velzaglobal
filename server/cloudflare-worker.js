/**
 * VELZA GLOBAL - Cloudflare Worker for CMS article pages
 * ------------------------------------------------------
 * Deploy ONLY on these routes (staging host first):
 *   www.velzaglobal.com/blogs/*
 *   www.velzaglobal.com/news/*
 * Never on www.velzaglobal.com/*. Region routing, redirects and error pages
 * stay in .htaccess; this Worker is not a router.
 *
 * Every request is sent to the origin unchanged and the origin's response is
 * returned as-is - static articles, redirects, 403s, 5xx, everything - with one
 * exception: a GET/HEAD of /blogs/<slug> or /news/<slug> that the origin answers
 * with 404 (no static article in the visitor's region). Only then is a published
 * CMS entry of that region rendered by server/cms/render-article.mjs. If there is
 * none, the origin's own 404 is returned.
 *
 * The Worker never requests /regions/... (the origin answers those with 404 on
 * purpose, .htaccess section 2). It only fetches public URLs: the article URL
 * itself and, when the CMS fails, the region's /503 page selected with ?_r=.
 *
 * Region: the rules of .htaccess section 9, in the same order (server/cms/region.mjs):
 *   9a  ?_r=in, then ?_r=ph, then ?_r=hk  (raw query string, case-insensitive)
 *   9b  CF-IPCountry request header IN -> in, PH -> ph
 *   9c  anything else -> hk
 *
 * Off unless the Worker has CMS_BASE_URL set. Optional: SITE_ORIGIN (canonical
 * and Open Graph URLs), CMS_MEDIA_BASE_URL. No API token is used.
 *
 * Deployment assumptions (verify on staging, see server/cms/README.md):
 *   - CF-IPCountry is present on the request the Worker receives (Managed
 *     Transform "Add visitor location headers"), so the Worker and .htaccess
 *     read the same value.
 *   - A Worker's fetch of its own route goes to the origin, not back into the
 *     Worker (Cloudflare's same-zone subrequest behaviour).
 */

import { renderArticle } from "./cms/render-article.mjs";
import { regionFor } from "./cms/region.mjs";
import { TEMPLATES } from "./cms/templates/index.mjs";
import { cmsConfig } from "../shared/js/velza-cms/cms-config.js";

// Exactly one path segment after /blogs/ or /news/; a trailing slash is the origin's 301.
const ARTICLE_ROUTE = /^\/(blogs|news)\/([^/]+)$/;

// Security headers .htaccess section 12 sets on every response. A CMS page replaces the origin's
// 404, so it carries the origin's values (including X-Robots-Tag on staging).
const ORIGIN_POLICY_HEADERS = [
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Strict-Transport-Security",
  "X-Robots-Tag",
];

// The region's error page through its public URL, keeping the renderer's status (never stale content).
async function errorResponse(request, region, out) {
  const page = new URL(request.url);
  page.pathname = `/${out.status}`;
  page.search = `?_r=${region}`;
  let body = String(out.status);
  try {
    const res = await fetch(page.toString(), { redirect: "manual", cf: { cacheEverything: false } });
    if (res.status === 200) body = await res.text();
  } catch {
    // Keep the plain-text body.
  }
  return new Response(request.method === "HEAD" ? null : body, { status: out.status, headers: out.headers });
}

// A Response for a CMS article (200) or a CMS failure (500/503), or null to keep the origin's 404.
async function renderCmsArticle(request, match, region, env, originResponse) {
  const out = await renderArticle({
    type: match[1],
    slug: match[2],
    region,
    template: (TEMPLATES[region] || {})[match[1]],
    config: {
      baseUrl: env.CMS_BASE_URL,
      mediaBaseUrl: env.CMS_MEDIA_BASE_URL || undefined,
      siteOrigin: env.SITE_ORIGIN || null,
      regionSlugs: cmsConfig.regionSlugs,
    },
  });

  let res;
  if (out.status === 200) {
    res = new Response(request.method === "HEAD" ? null : out.body, { status: 200, headers: out.headers });
    res.headers.set("X-Velza-Source", "cms");
  } else if (out.status === 500 || out.status === 503) {
    res = await errorResponse(request, region, out);
  } else {
    return null;
  }
  for (const name of ORIGIN_POLICY_HEADERS) {
    const value = originResponse.headers.get(name);
    if (value !== null) res.headers.set(name, value);
  }
  res.headers.set("X-Velza-Region", region);
  return res;
}

export default {
  async fetch(request, env) {
    const match = ARTICLE_ROUTE.exec(new URL(request.url).pathname);
    const renderable = match && (request.method === "GET" || request.method === "HEAD") && env && env.CMS_BASE_URL;

    const response = await fetch(request);
    if (!renderable || response.status !== 404) return response;

    let cms = null;
    try {
      cms = await renderCmsArticle(request, match, regionFor(request), env, response);
    } catch {
      cms = null; // any renderer failure keeps the origin's 404
    }
    if (!cms) return response;
    if (response.body) response.body.cancel().catch(() => {});
    return cms;
  },
};
