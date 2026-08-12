(function (window, document) {
    "use strict";

    /*
     * CHANGES vs the current region/region-switcher.js
     * ------------------------------------------------
     * 1. setRegion() now RELOADS the page. Previously it only wrote a
     *    cookie and swapped the label text, so clicking "India" changed
     *    the flag but left the visitor on the Hong Kong pages forever.
     *    The server can only act on the cookie at the NEXT request.
     * 2. The cookie is written with Secure on HTTPS.
     * 3. No-op if the visitor picks the region they are already on, so
     *    we don't reload for nothing.
     * 4. Everything else (storage keys, event name, public API) is
     *    unchanged, so nothing else in the theme needs touching.
     */

    var STORAGE_KEY = "velzaRegion";
    var COOKIE_KEY = "velzaRegion";
    var REGIONS = window.VELZA_REGIONS || {};
    var DEFAULT_REGION = window.VELZA_DEFAULT_REGION || "hk";

    function valid(code) { return !!REGIONS[code]; }

    function readCookie() {
        var m = document.cookie.match(/(?:^|;\s*)velzaRegion=([a-z]{2})(?:;|$)/i);
        return m && valid(m[1].toLowerCase()) ? m[1].toLowerCase() : null;
    }

    function readStored() {
        try {
            var v = localStorage.getItem(STORAGE_KEY);
            return valid(v) ? v : null;
        } catch (e) { return null; }
    }

    function writePreference(code) {
        try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
        try {
            var secure = window.location.protocol === "https:" ? "; Secure" : "";
            document.cookie = COOKIE_KEY + "=" + encodeURIComponent(code) +
                "; path=/; max-age=" + (60 * 60 * 24 * 365) + "; SameSite=Lax" + secure;
        } catch (e) {}
    }

    // The cookie is the source of truth, because it is the only thing the
    // server sees. localStorage is just a fallback for the label.
    function getRegion() { return readCookie() || readStored() || DEFAULT_REGION; }

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

        writePreference(code);
        updateTrigger(code);
        window.dispatchEvent(new CustomEvent("velzaRegionChanged", {
            detail: { region: code, config: REGIONS[code] }
        }));

        // The server decides which files to serve, based on the cookie we
        // just wrote. Reload so it can. Cache-buster keeps intermediate
        // proxies from handing back the previous region's HTML.
        var url = new URL(window.location.href);
        url.searchParams.set("_r", code);
        window.location.replace(url.toString());

        return code;
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
        updateTrigger(getRegion());
        bind();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})(window, document);
