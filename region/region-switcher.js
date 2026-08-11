(function (window, document) {
    "use strict";

    var STORAGE_KEY = "velzaRegion";
    var COOKIE_KEY = "velzaRegion";
    var REGIONS = window.VELZA_REGIONS || {};
    var DEFAULT_REGION = window.VELZA_DEFAULT_REGION || "hk";

    function valid(code) { return !!REGIONS[code]; }

    function readStored() {
        try {
            var v = localStorage.getItem(STORAGE_KEY);
            return valid(v) ? v : null;
        } catch (e) { return null; }
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

    function setRegion(code) {
        if (!valid(code)) return getRegion();
        writePreference(code);
        updateTrigger(code);
        window.dispatchEvent(new CustomEvent("velzaRegionChanged", { detail: { region: code, config: REGIONS[code] } }));
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
