(function (window, document) {
    "use strict";

    var STORAGE_KEY = "velzaRegion";
    var COOKIE_KEY = "velzaRegion";
    var REGIONS = window.VELZA_REGIONS || {};
    var DEFAULT_REGION = window.VELZA_DEFAULT_REGION || "hk";

    function valid(code) { return !!REGIONS[code]; }

    /* The COOKIE is the authoritative preference: it is the only one of the
       two stores the server can see, and the root .htaccess routes on it.
       localStorage is a fallback for the case where the cookie has expired
       (1 year) or been cleared independently - reading it lets init() restore
       the cookie so the server and the UI agree again. */
    function readCookie() {
        try {
            var m = document.cookie.match(/(?:^|;\s*)velzaRegion=([^;]*)/);
            var v = m ? decodeURIComponent(m[1]) : null;
            return valid(v) ? v : null;
        } catch (e) { return null; }
    }

    function readLocal() {
        try {
            var v = localStorage.getItem(STORAGE_KEY);
            return valid(v) ? v : null;
        } catch (e) { return null; }
    }

    function readStored() {
        return readCookie() || readLocal();
    }

    function writePreference(code) {
        try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
        try {
            document.cookie = COOKIE_KEY + "=" + encodeURIComponent(code) + "; path=/; max-age=" + (60 * 60 * 24 * 365) + "; SameSite=Lax";
        } catch (e) {}
    }

    function getRegion() { return readStored() || DEFAULT_REGION; }

    function updateTrigger(code) {
        var region = REGIONS[code];
        var trigger = document.getElementById("sk__country-switcher-trigger");
        if (!region || !trigger) return;
        var flag = trigger.querySelector(".sk__country-switcher-flag");
        var label = trigger.querySelector("[data-velza-location-name]");
        if (flag) flag.className = flag.className.replace(/fi-[a-z]{2}\b/, "fi-" + region.code);
        if (label) label.textContent = region.name;
    }

    function setRegion(code, options) {
        if (!valid(code)) return getRegion();
        if (code === getRegion() && !(options && options.force)) return code;

        writePreference(code);
        updateTrigger(code);
        window.dispatchEvent(new CustomEvent("velzaRegionChanged", { detail: { region: code, config: REGIONS[code] } }));

        /* Regional content is chosen SERVER-SIDE: the root .htaccess reads the
           velzaRegion cookie written just above and internally rewrites the
           request to /regions/<code>/. The page currently in the browser was
           already rendered from the previous region, so writing the cookie
           alone changes nothing visible beyond the switcher label.

           Reloading re-issues the request with the new cookie, and the server
           serves the chosen region. The URL is unchanged by the reload, so the
           address bar keeps showing www.velzaglobal.com either way.

           Opt out with VelzaRegion.set(code, { reload: false }) if a caller
           wants to handle the transition itself via velzaRegionChanged. */
        if (!options || options.reload !== false) {
            window.location.reload();
        }

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
        /* If a preference survives in localStorage but the cookie is gone
           (expired, or cleared by a privacy tool), the server has silently
           fallen back to geo-IP while the UI still claims the old region.
           Re-issue the cookie so the next navigation matches the label.
           No reload here - that would be a surprise on page load, and the
           current page is already rendered. */
        var local = readLocal();
        if (local && !readCookie()) {
            writePreference(local);
        }

        updateTrigger(getRegion());
        bind();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})(window, document);
