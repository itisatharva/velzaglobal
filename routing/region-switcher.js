(function (window, document) {
    "use strict";

    /*
     * REGION MODEL: the visitor's choice lasts exactly one page view.
     * ---------------------------------------------------------------
     * Geolocation decides the region. The flag menu can override it,
     * but the override is NOT remembered: reload or navigate and the
     * visitor is back on their geo region.
     *
     * There is deliberately no cookie and no localStorage. The choice
     * travels in the ?_r=<code> query parameter, which .htaccess
     * section 9a reads before it looks at CF-IPCountry. Because nothing
     * is stored, "revert on reload" needs no expiry logic - it is just
     * what happens when the parameter is gone.
     *
     * getRegion() reads data-velza-region off <html>. That attribute is
     * baked into each regions/<code>/*.html file, so it is the region
     * the server ACTUALLY served. Guessing it client-side was the old
     * bug: a visitor in India was served the India site but the menu
     * said "Hong Kong (HQ)", because the default was assumed whenever
     * no cookie existed.
     */

    var REGIONS = window.VELZA_REGIONS || {};
    var DEFAULT_REGION = window.VELZA_DEFAULT_REGION || "hk";
    var PARAM = "_r";

    function valid(code) { return !!REGIONS[code]; }

    // The server is the only authority on which region was served.
    function getRegion() {
        var v = document.documentElement.getAttribute("data-velza-region");
        return valid(v) ? v : DEFAULT_REGION;
    }

    function updateTrigger(code) {
        var region = REGIONS[code];
        var trigger = document.getElementById("sk__country-switcher-trigger");
        if (!region || !trigger) return;
        var flag = trigger.querySelector(".sk__country-switcher-flag");
        var label = trigger.querySelector("[data-velza-location-name]");
        if (flag) flag.className = flag.className.replace(/fi-[a-z]{2}\b/, "fi-" + region.code);
        if (label) label.textContent = region.name;
    }

    function setRegion(code) {
        if (!valid(code)) return getRegion();
        if (code === getRegion()) return code;          // already there

        window.dispatchEvent(new CustomEvent("velzaRegionChanged", {
            detail: { region: code, config: REGIONS[code] }
        }));

        // Only the server can swap the HTML, and it decides from the
        // query parameter. Reload so it can. The parameter doubles as a
        // cache-buster, keeping proxies from handing back the previous
        // region's HTML.
        var url = new URL(window.location.href);
        url.searchParams.set(PARAM, code);
        window.location.replace(url.toString());

        return code;
    }

    // Take ?_r= back out of the address bar once the server has acted
    // on it. Two reasons: the visitor should not see a stray parameter,
    // and a reload must fall back to geolocation - which it cannot do
    // while the override is still sitting in the URL.
    function stripParam() {
        try {
            var url = new URL(window.location.href);
            if (!url.searchParams.has(PARAM)) return;
            url.searchParams.delete(PARAM);
            history.replaceState(null, "", url.pathname + url.search + url.hash);
        } catch (e) {}
    }

    // Visitors carry a velzaRegion cookie from the build that persisted
    // the choice. The server ignores it now; clear it so it cannot be
    // mistaken for live state later. Safe to delete this after one
    // deploy cycle.
    function clearLegacyState() {
        try { localStorage.removeItem("velzaRegion"); } catch (e) {}
        try {
            if (/(?:^|;\s*)velzaRegion=/.test(document.cookie)) {
                document.cookie = "velzaRegion=; path=/; max-age=0; SameSite=Lax";
            }
        } catch (e) {}
    }

    function bind() {
        var menu = document.getElementById("sk__country-switcher-menu");
        if (!menu) return;
        menu.addEventListener("click", function (e) {
            var link = e.target.closest ? e.target.closest("a[data-region]") : null;
            if (!link) return;
            var code = link.getAttribute("data-region");
            if (!valid(code)) return;
            e.preventDefault();
            setRegion(code);
        });
    }

    window.VelzaRegion = { get: getRegion, set: setRegion };

    function init() {
        clearLegacyState();
        stripParam();
        updateTrigger(getRegion());
        bind();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})(window, document);
