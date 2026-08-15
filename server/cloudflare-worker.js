/**
 * VELZA GLOBAL - Cloudflare Worker regional router
 * ------------------------------------------------
 * Deploy on the route:  www.velzaglobal.com/*
 *
 * This is the cleanest place to do the routing, because Cloudflare
 * already knows the visitor's country (request.cf.country) and can
 * fetch a different origin path without the browser ever seeing it.
 *
 * Origin layout it expects:
 *   /regions/hk/...   /regions/ph/...   /regions/in/...   /region/...
 *
 * Precedence, deliberately:  ?_r= param  >  country  >  hk fallback.
 * The manual pick is good for ONE page view. It is not persisted, so a
 * reload or any navigation drops back to the visitor's geo region. Keep
 * this in step with .htaccess section 9 - both encode the same contract.
 */

const REGIONS = new Set(["hk", "ph", "in"]);
const DEFAULT_REGION = "hk";
const REGION_PARAM = "_r";

// Paths that are shared and must NOT be pushed into a region folder.
const SHARED_PREFIXES = ["/shared/", "/routing/", "/events/", "/.well-known/"];

function regionFromParam(url) {
  const code = (url.searchParams.get(REGION_PARAM) || "").toLowerCase();
  return REGIONS.has(code) ? code : null;
}

function regionFromCountry(request) {
  const country = (request.cf && request.cf.country) || "";
  if (country === "IN") return "in";
  if (country === "PH") return "ph";
  return DEFAULT_REGION; // HK and every other country
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Shared assets pass straight through.
    if (SHARED_PREFIXES.some((p) => url.pathname.startsWith(p))) {
      return fetch(request);
    }

    // Never let anyone reach the region folders directly - that would
    // create duplicate, indexable copies of the whole site.
    if (url.pathname.startsWith("/regions/")) {
      return new Response("Not found", { status: 404 });
    }

    const region = regionFromParam(url) || regionFromCountry(request);

    const origin = new URL(request.url);
    origin.pathname = `/regions/${region}${url.pathname}`;

    const response = await fetch(new Request(origin.toString(), request), {
      // HTML varies per visitor; let the origin/CDN rules handle assets.
      cf: { cacheEverything: false },
    });

    const out = new Response(response.body, response);
    out.headers.set("X-Velza-Region", region);

    // The region comes from the visitor's IP, which no cache can Vary
    // on. Shared caches must not store this HTML at all. (The ?_r=
    // override needs no Vary - it is already part of the cache key.)
    const type = out.headers.get("Content-Type") || "";
    if (type.includes("text/html")) {
      out.headers.set("Cache-Control", "private, no-cache, must-revalidate");
    }

    return out;
  },
};
