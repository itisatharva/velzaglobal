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
        url.hash = "";
        url.searchParams.set(PARAM, code);
        goToEquivalentPage(url.toString(), code);

        return code;
    }

    // Stay on the equivalent page in the chosen region. If that region has
    // no such page (e.g. a CMS article published for one region only), go
    // to the region's homepage instead of a 404. Any doubt (network error,
    // timeout, no fetch) keeps the plain navigation - never worse than before.
    function goToEquivalentPage(target, code) {
        var home = "/?" + PARAM + "=" + encodeURIComponent(code);
        var go = function (href) { window.location.replace(href); };
        if (typeof window.fetch !== "function") return go(target);
        var done = false;
        var timer = setTimeout(function () { if (!done) { done = true; go(target); } }, 3000);
        window.fetch(target, { method: "HEAD", cache: "no-store", credentials: "same-origin" })
            .then(function (res) { if (!done) { done = true; clearTimeout(timer); go(res.status === 404 ? home : target); } })
            .catch(function () { if (!done) { done = true; clearTimeout(timer); go(target); } });
    }

    // ---- Switcher UI ------------------------------------------------------
    // The homepages ship the switcher markup. Inner pages only carry
    // data-velza-region on <html>; the same markup is built here so it has a
    // single source. Built synchronously when this script runs (before
    // DOMContentLoaded) so theme.js and custom.js find it like on the homepage.
    // Nothing is built when the served region is unknown (no attribute).
    var FLAG_CSS = "https://cdnjs.cloudflare.com/ajax/libs/flag-icons/7.2.3/css/flag-icons.min.css";

    function el(tag, attrs, children) {
        var node = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
        (children || []).forEach(function (c) { node.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
        return node;
    }

    function flag(code) {
        return el("span", { "class": "fi fi-" + code + " fis sk__country-switcher-flag", "aria-hidden": "true" });
    }

    function ensureFlagCss() {
        if (document.querySelector('link[href*="/flag-icons/"]')) return;
        document.head.appendChild(el("link", { rel: "stylesheet", href: FLAG_CSS }));
    }

    function buildSwitcher() {
        if (document.getElementById("sk__country-switcher-menu")) return;
        var served = document.documentElement.getAttribute("data-velza-region");
        var anchor = document.querySelector(".sk__mobile-menu-bar");
        if (!valid(served) || !anchor || !anchor.parentNode) return;

        var caret = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        caret.setAttribute("class", "sk__country-switcher-caret");
        caret.setAttribute("viewBox", "0 0 24 24");
        caret.setAttribute("width", "14");
        caret.setAttribute("height", "14");
        caret.setAttribute("fill", "none");
        caret.setAttribute("stroke", "currentColor");
        caret.setAttribute("stroke-width", "2");
        caret.setAttribute("aria-hidden", "true");
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M6 9l6 6 6-6");
        caret.appendChild(path);

        var trigger = el("button", {
            type: "button", "class": "sk__country-switcher-trigger", id: "sk__country-switcher-trigger",
            "data-velza-location-button": "", "aria-expanded": "false", "aria-controls": "sk__country-switcher-menu"
        }, [flag(served), el("span", { "data-velza-location-name": "" }, [REGIONS[served].name]), caret]);

        var items = Object.keys(REGIONS).map(function (code) {
            return el("li", {}, [el("a", { href: "#", "data-region": code }, [flag(code), " " + REGIONS[code].name])]);
        });
        var menu = el("ul", { id: "sk__country-switcher-menu", "class": "sk__country-switcher-menu" }, items);
        var wrap = el("div", { "class": "sk__country-switcher-wrap" }, [trigger, menu]);
        var actions = el("div", { "class": "sk__header-actions" }, [wrap]);
        // Same structure as the homepages: <div.sk__header-actions> holds the switcher AND the mobile menu bar.
        // (Leaving the bar outside puts it on top of the switcher, so clicks never reach the button.)
        anchor.parentNode.insertBefore(actions, anchor);
        actions.appendChild(anchor);
        ensureFlagCss();
    }

    // custom.js (loaded on some pages) already opens/closes the menu on click
    // and Escape. Where it is not loaded, this script does the same, so the
    // menu is never toggled twice.
    function customJsHandlesMenu() {
        return !!document.querySelector('script[src*="/shared/js/custom.js"]');
    }

    function setOpen(trigger, menu, open) {
        menu.classList.toggle("sk__open", open);
        trigger.classList.toggle("sk__active", open);
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function bindMenu(trigger, menu) {
        if (customJsHandlesMenu()) return;
        trigger.addEventListener("click", function (e) {
            e.stopPropagation();
            setOpen(trigger, menu, !menu.classList.contains("sk__open"));
        });
        document.addEventListener("click", function (e) {
            if (!menu.contains(e.target) && e.target !== trigger) setOpen(trigger, menu, false);
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") setOpen(trigger, menu, false);
        });
    }

    // Keyboard: arrow keys open the menu and move between regions; Escape
    // returns focus to the button; Tab out closes it. Works with either
    // click handler (custom.js or bindMenu above).
    function bindKeyboard(trigger, menu) {
        var links = function () { return Array.prototype.slice.call(menu.querySelectorAll("a[data-region]")); };
        var focusAt = function (i) { var l = links(); if (l.length) l[(i + l.length) % l.length].focus(); };
        trigger.addEventListener("keydown", function (e) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setOpen(trigger, menu, true);
                focusAt(e.key === "ArrowDown" ? 0 : -1);
            }
        });
        menu.addEventListener("keydown", function (e) {
            var l = links(), i = l.indexOf(document.activeElement);
            if (e.key === "ArrowDown") { e.preventDefault(); focusAt(i + 1); }
            else if (e.key === "ArrowUp") { e.preventDefault(); focusAt(i - 1); }
            else if (e.key === "Home") { e.preventDefault(); focusAt(0); }
            else if (e.key === "End") { e.preventDefault(); focusAt(-1); }
            else if (e.key === "Escape") { setOpen(trigger, menu, false); trigger.focus(); }
            else if (e.key === "Tab") { setOpen(trigger, menu, false); }
        });
    }

    function markCurrent(menu) {
        var current = getRegion();
        Array.prototype.forEach.call(menu.querySelectorAll("a[data-region]"), function (a) {
            if (a.getAttribute("data-region") === current) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
        });
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
        var trigger = document.getElementById("sk__country-switcher-trigger");
        if (!menu) return;
        menu.addEventListener("click", function (e) {
            var link = e.target.closest ? e.target.closest("a[data-region]") : null;
            if (!link) return;
            var code = link.getAttribute("data-region");
            if (!valid(code)) return;
            e.preventDefault();
            setRegion(code);
        });
        markCurrent(menu);
        if (trigger) {
            bindMenu(trigger, menu);
            bindKeyboard(trigger, menu);
        }
    }

    window.VelzaRegion = { get: getRegion, set: setRegion };

    function init() {
        clearLegacyState();
        stripParam();
        updateTrigger(getRegion());
        bind();
    }

    // Build before DOMContentLoaded (this script is loaded at the end of <body>).
    try { buildSwitcher(); } catch (e) {}

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})(window, document);
