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
 * Precedence, deliberately:  cookie  >  country  >  hk fallback.
 * A person who manually picks a country must never be overridden by
 * their IP on the next page load.
 */

const REGIONS = new Set(["hk", "ph", "in"]);
const DEFAULT_REGION = "hk";
const COOKIE_NAME = "velzaRegion";

// Paths that are shared and must NOT be pushed into a region folder.
const SHARED_PREFIXES = ["/shared/", "/routing/", "/events/", "/.well-known/"];

function regionFromCookie(request) {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(/(?:^|;\s*)velzaRegion=([a-z]{2})(?:;|$)/i);
  const code = match && match[1].toLowerCase();
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

    const region = regionFromCookie(request) || regionFromCountry(request);

    const origin = new URL(request.url);
    origin.pathname = `/regions/${region}${url.pathname}`;

    const response = await fetch(new Request(origin.toString(), request), {
      // HTML varies per visitor; let the origin/CDN rules handle assets.
      cf: { cacheEverything: false },
    });

    const out = new Response(response.body, response);
    out.headers.set("X-Velza-Region", region);

    // Tell shared caches the HTML is not one-size-fits-all.
    const type = out.headers.get("Content-Type") || "";
    if (type.includes("text/html")) {
      const vary = out.headers.get("Vary");
      out.headers.set("Vary", vary ? `${vary}, Cookie` : "Cookie");
    }

    return out;
  },
};
