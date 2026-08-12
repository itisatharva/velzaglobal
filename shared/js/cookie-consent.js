/* ==========================================================================
   VELZA GLOBAL — CONSENT MANAGEMENT SYSTEM
   assets/js/cookie-consent.js

   Vanilla JS. No dependencies. Single global: window.VelzaCookieConsent.
   Does not touch jQuery, GSAP, ScrollSmoother, the offcanvas nav or any
   existing theme behaviour.

   Public API
     VelzaCookieConsent.init()
     VelzaCookieConsent.acceptAll()
     VelzaCookieConsent.rejectAll()
     VelzaCookieConsent.openPreferences()
     VelzaCookieConsent.closePreferences()
     VelzaCookieConsent.getConsent()
     VelzaCookieConsent.savePreferences({analytics:true, ...})
     VelzaCookieConsent.withdrawConsent()
     VelzaCookieConsent.onChange(fn)
   ========================================================================== */

window.VelzaCookieConsent = (function (window, document) {
    "use strict";

    /* ======================================================================
       1. CONFIGURATION  — edit this block only
       ====================================================================== */

    /* Bump this string to re-request consent from every visitor.
       Do this whenever you add a new vendor, a new category, or materially
       change what the existing categories do. */
    var COOKIE_CONSENT_VERSION = "1.0";

    /* Set to false before going live. */
    var COOKIE_DEBUG = false;

    var COOKIE_CONFIG = {
        /* First-party cookie name holding the consent record. */
        cookieName: "velza_cookie_consent",

        /* How long the consent record lives, in days.
           13 months (395) is the common retention ceiling in the EU. */
        storageDays: 395,

        /* ---- Google Analytics 4, loaded DIRECTLY (not via GTM) ----
           Leave analyticsId empty to skip direct GA entirely.
           IMPORTANT: if GA4 is already firing inside your GTM container,
           leave this EMPTY or you will double-count every pageview. */
        analyticsId: "",
        enableAnalytics: true,

        /* ---- Google Tag Manager ----
           GTM-W333F6RK is already hard-coded in the <head> of every page.
           Leaving this true makes the consent system drive GTM through
           Google Consent Mode v2 instead of loading a second container. */
        enableGtmConsentMode: true,

        /* Policy links shown in the banner and the modal.
           Leave cookiePolicyUrl empty and that link is simply not rendered. */
        privacyPolicyUrl: "/privacypolicy",
        cookiePolicyUrl: "",

        /* Show the persistent "Cookie Settings" button after a choice. */
        showSettingsButton: true
    };

    /* ----------------------------------------------------------------------
       COOKIE INVENTORY
       Deliberately EMPTY. Populate from a real audit of your own site —
       see the notes file for how. Anything listed here is rendered in the
       modal under its category; anything not listed is simply not claimed.

       Shape: { name, provider, purpose, duration, type }
       ---------------------------------------------------------------------- */
    var COOKIE_CATEGORIES = {
        necessary: [],
        preferences: [],
        analytics: [],
        marketing: []
    };

    /* ----------------------------------------------------------------------
       CATEGORY DEFINITIONS — add a new object here and the UI, storage,
       script gating and Consent Mode mapping all pick it up automatically.
       ---------------------------------------------------------------------- */
    var CATEGORY_DEFS = [
        {
            id: "necessary",
            label: "Necessary Cookies",
            description:
                "Required for basic website functionality, security and " +
                "remembering your cookie choice. These cannot be switched off.",
            locked: true,
            defaultValue: true
        },
        {
            id: "preferences",
            label: "Preferences Cookies",
            description:
                "Remember choices such as your regional site and other " +
                "display settings so you do not have to set them again.",
            locked: false,
            defaultValue: false
        },
        {
            id: "analytics",
            label: "Analytics Cookies",
            description:
                "Help us understand how the site is used — which pages are " +
                "visited and where visitors encounter problems — so we can " +
                "improve performance.",
            locked: false,
            defaultValue: false
        },
        {
            id: "marketing",
            label: "Marketing Cookies",
            description:
                "Used to measure campaign performance and show relevant " +
                "advertising on third-party platforms where applicable.",
            locked: false,
            defaultValue: false
        }
    ];

    /* Google Consent Mode v2 signal mapping. */
    var CONSENT_MODE_MAP = {
        necessary: ["security_storage"],
        preferences: ["functionality_storage", "personalization_storage"],
        analytics: ["analytics_storage"],
        marketing: ["ad_storage", "ad_user_data", "ad_personalization"]
    };

    var COPY = {
        bannerEyebrow: "Your Privacy Matters",
        bannerTitle: "Your Privacy Matters",
        bannerText:
            "We use cookies and similar technologies to provide essential " +
            "website functionality, understand how visitors interact with " +
            "our website, and improve your experience. You can manage your " +
            "preferences at any time.",
        acceptAll: "Accept All",
        rejectAll: "Reject All",
        customise: "Cookie Settings",
        modalTitle: "Cookie Preferences",
        modalIntro:
            "We use cookies to improve your experience and understand how " +
            "our website is used. Necessary cookies are always active. " +
            "Everything else is off until you turn it on.",
        savePreferences: "Save Preferences",
        alwaysActive: "Always Active",
        on: "On",
        off: "Off",
        settingsButton: "Cookie Settings",
        privacyPolicy: "Privacy Policy",
        cookiePolicy: "Cookie Policy",
        closeLabel: "Close cookie preferences"
    };

    /* ======================================================================
       2. INTERNALS — no configuration below this line
       ====================================================================== */

    var CATEGORY_IDS = CATEGORY_DEFS.map(function (c) {
        return c.id;
    });

    var state = {
        consent: null,
        initialised: false,
        bannerEl: null,
        modalEl: null,
        settingsEl: null,
        rootEl: null,
        inputs: {},
        stateEls: {},
        lastFocused: null,
        keydownBound: null,
        listeners: [],
        loaded: { analytics: false, marketing: false }
    };

    function log() {
        if (!COOKIE_DEBUG || !window.console || !window.console.log) return;
        var args = Array.prototype.slice.call(arguments);
        args.unshift("[Velza Cookie]");
        window.console.log.apply(window.console, args);
    }

    function warn() {
        if (!window.console || !window.console.warn) return;
        var args = Array.prototype.slice.call(arguments);
        args.unshift("[Velza Cookie]");
        window.console.warn.apply(window.console, args);
    }

    /* ---- element helper: text is always set via textContent, never HTML --- */
    function el(tag, attrs, text) {
        var node = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (k) {
                if (attrs[k] === null || attrs[k] === false) return;
                if (k === "className") node.className = attrs[k];
                else node.setAttribute(k, attrs[k]);
            });
        }
        if (text !== undefined && text !== null) node.textContent = String(text);
        return node;
    }

    /* Static, author-authored SVG only. Never receives external input. */
    function svg(paths, viewBox) {
        var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        s.setAttribute("viewBox", viewBox || "0 0 24 24");
        s.setAttribute("aria-hidden", "true");
        s.setAttribute("focusable", "false");
        paths.forEach(function (d) {
            var p = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );
            p.setAttribute("d", d);
            s.appendChild(p);
        });
        return s;
    }

    /* ---------------------------- storage -------------------------------- */

    function defaultConsent() {
        var o = {};
        CATEGORY_DEFS.forEach(function (c) {
            o[c.id] = c.locked ? true : c.defaultValue === true;
        });
        return o;
    }

    function writeCookie(name, value, days) {
        var parts = [
            name + "=" + encodeURIComponent(value),
            "path=/",
            "SameSite=Lax"
        ];
        if (days) {
            var d = new Date();
            d.setTime(d.getTime() + days * 864e5);
            parts.push("expires=" + d.toUTCString());
            parts.push("max-age=" + days * 86400);
        }
        if (window.location.protocol === "https:") parts.push("Secure");
        try {
            document.cookie = parts.join("; ");
        } catch (e) {
            /* cookies blocked — localStorage mirror below still applies */
        }
    }

    function readCookie(name) {
        var target = name + "=";
        var all = String(document.cookie || "").split(";");
        for (var i = 0; i < all.length; i++) {
            var c = all[i].trim();
            if (c.indexOf(target) === 0) {
                return decodeURIComponent(c.substring(target.length));
            }
        }
        return null;
    }

    function deleteCookie(name) {
        writeCookie(name, "", -1);
    }

    function persist(consent) {
        var record = {};
        CATEGORY_IDS.forEach(function (id) {
            record[id] = consent[id] === true;
        });
        CATEGORY_DEFS.forEach(function (c) {
            if (c.locked) record[c.id] = true;
        });
        record.timestamp = new Date().toISOString();
        record.version = COOKIE_CONSENT_VERSION;

        var raw = JSON.stringify(record);
        writeCookie(COOKIE_CONFIG.cookieName, raw, COOKIE_CONFIG.storageDays);
        try {
            window.localStorage.setItem(COOKIE_CONFIG.cookieName, raw);
        } catch (e) {
            /* private mode / storage disabled — cookie is the primary store */
        }
        state.consent = record;
        log("Consent saved", record);
        return record;
    }

    function restore() {
        var raw = readCookie(COOKIE_CONFIG.cookieName);
        if (!raw) {
            try {
                raw = window.localStorage.getItem(COOKIE_CONFIG.cookieName);
            } catch (e) {
                raw = null;
            }
        }
        if (!raw) return null;

        var parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            warn("Stored consent was unreadable and has been discarded.");
            return null;
        }
        if (!parsed || typeof parsed !== "object") return null;

        if (parsed.version !== COOKIE_CONSENT_VERSION) {
            log(
                "Consent version changed (" +
                    parsed.version +
                    " -> " +
                    COOKIE_CONSENT_VERSION +
                    "). Re-asking."
            );
            return null;
        }

        /* A category added since the record was written defaults to off. */
        var normalised = {};
        CATEGORY_DEFS.forEach(function (c) {
            normalised[c.id] = c.locked ? true : parsed[c.id] === true;
        });
        normalised.timestamp = parsed.timestamp;
        normalised.version = parsed.version;
        return normalised;
    }

    /* ------------------------ Consent Mode v2 ---------------------------- */

    function dataLayerPush() {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(arguments);
    }

    function pushConsentUpdate(consent) {
        if (!COOKIE_CONFIG.enableGtmConsentMode) return;

        var signals = { wait_for_update: 500 };
        CATEGORY_IDS.forEach(function (id) {
            var keys = CONSENT_MODE_MAP[id] || [];
            keys.forEach(function (k) {
                signals[k] = consent[id] ? "granted" : "denied";
            });
        });
        delete signals.wait_for_update;

        dataLayerPush("consent", "update", signals);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: "velza_consent_update",
            velza_consent_analytics: consent.analytics ? "granted" : "denied",
            velza_consent_marketing: consent.marketing ? "granted" : "denied",
            velza_consent_preferences: consent.preferences
                ? "granted"
                : "denied"
        });
        log("Consent Mode updated", signals);
    }

    /* --------------------- gated script activation ------------------------ */

    /* Activates <script type="text/plain" data-cookie-category="analytics">
       blocks once their category is granted. Idempotent. */
    function activateGatedScripts(consent) {
        var nodes = document.querySelectorAll(
            'script[type="text/plain"][data-cookie-category]'
        );
        Array.prototype.forEach.call(nodes, function (node) {
            var cat = node.getAttribute("data-cookie-category");
            if (!cat || consent[cat] !== true) return;
            if (node.getAttribute("data-cookie-activated") === "true") return;

            var fresh = document.createElement("script");
            /* copy through every attribute except the gating ones */
            Array.prototype.forEach.call(node.attributes, function (attr) {
                if (attr.name === "type") return;
                if (attr.name === "data-cookie-category") return;
                if (attr.name === "data-cookie-activated") return;
                if (attr.name === "data-cookie-src") return;
                fresh.setAttribute(attr.name, attr.value);
            });
            var src = node.getAttribute("data-cookie-src") || node.src;
            if (src) fresh.src = src;
            else fresh.text = node.textContent || "";

            node.setAttribute("data-cookie-activated", "true");
            node.parentNode.insertBefore(fresh, node.nextSibling);
            log('Activated gated script for "' + cat + '"');
        });
    }

    /* ------------------------- vendor loaders ---------------------------- */

    function loadAnalytics() {
        if (state.loaded.analytics) return;
        if (!COOKIE_CONFIG.enableAnalytics) {
            log("Analytics disabled by configuration");
            return;
        }
        if (!COOKIE_CONFIG.analyticsId) {
            log(
                "Analytics consent granted, but analyticsId is empty — " +
                    "nothing loaded directly. If GA4 lives in GTM, that is correct."
            );
            return;
        }
        if (COOKIE_CONFIG.enableGtmConsentMode) {
            warn(
                "analyticsId is set AND enableGtmConsentMode is true. If GA4 " +
                    "also fires inside GTM you will double-count pageviews. " +
                    "Pick one delivery path."
            );
        }

        var id = COOKIE_CONFIG.analyticsId;
        var s = document.createElement("script");
        s.async = true;
        s.src =
            "https://www.googletagmanager.com/gtag/js?id=" +
            encodeURIComponent(id);
        document.head.appendChild(s);

        dataLayerPush("js", new Date());
        dataLayerPush("config", id, { anonymize_ip: true });

        state.loaded.analytics = true;
        log("Analytics enabled (" + id + ")");
    }

    /* Marketing vendors go here. Intentionally empty — add Meta Pixel,
       LinkedIn Insight Tag etc. only when they are actually in use. */
    function loadMarketingScripts() {
        if (state.loaded.marketing) return;
        state.loaded.marketing = true;
        log("Marketing enabled — no marketing vendors configured");

        /* Example shape, left commented on purpose:
        var s = document.createElement("script");
        s.async = true;
        s.src = "https://connect.facebook.net/en_US/fbevents.js";
        document.head.appendChild(s);
        */
    }

    function applyConsent(consent) {
        pushConsentUpdate(consent);
        activateGatedScripts(consent);

        if (consent.analytics === true) loadAnalytics();
        else log("Analytics disabled");

        if (consent.marketing === true) loadMarketingScripts();
        else log("Marketing disabled");

        state.listeners.forEach(function (fn) {
            try {
                fn(getConsent());
            } catch (e) {
                warn("onChange listener threw", e);
            }
        });
    }

    /* ============================== UI ==================================== */

    function buildRoot() {
        var root = el("div", {
            className: "vg-cookie-consent",
            "data-vg-cookie-root": "true"
        });
        document.body.appendChild(root);
        return root;
    }

    function policyLinks() {
        var wrap = el("div", { className: "vg-cookie-links" });
        if (COOKIE_CONFIG.privacyPolicyUrl) {
            wrap.appendChild(
                el(
                    "a",
                    { href: COOKIE_CONFIG.privacyPolicyUrl },
                    COPY.privacyPolicy
                )
            );
        }
        if (COOKIE_CONFIG.cookiePolicyUrl) {
            wrap.appendChild(
                el(
                    "a",
                    { href: COOKIE_CONFIG.cookiePolicyUrl },
                    COPY.cookiePolicy
                )
            );
        }
        return wrap.childNodes.length ? wrap : null;
    }

    function buildBanner() {
        var banner = el("section", {
            className: "vg-cookie-banner",
            role: "dialog",
            "aria-modal": "false",
            "aria-labelledby": "vg-cookie-banner-title",
            "aria-describedby": "vg-cookie-banner-text",
            tabindex: "-1"
        });

        banner.appendChild(
            el("p", { className: "vg-cookie-eyebrow" }, COPY.bannerEyebrow)
        );
        banner.appendChild(
            el(
                "h2",
                {
                    className: "vg-cookie-banner-title",
                    id: "vg-cookie-banner-title"
                },
                COPY.bannerTitle
            )
        );
        banner.appendChild(
            el(
                "p",
                {
                    className: "vg-cookie-banner-text",
                    id: "vg-cookie-banner-text"
                },
                COPY.bannerText
            )
        );

        var actions = el("div", { className: "vg-cookie-banner-actions" });
        var reject = el(
            "button",
            {
                type: "button",
                className: "vg-cookie-btn vg-cookie-btn-secondary"
            },
            COPY.rejectAll
        );
        var accept = el(
            "button",
            {
                type: "button",
                className: "vg-cookie-btn vg-cookie-btn-primary"
            },
            COPY.acceptAll
        );
        reject.addEventListener("click", function () {
            rejectAll();
        });
        accept.addEventListener("click", function () {
            acceptAll();
        });
        actions.appendChild(reject);
        actions.appendChild(accept);
        banner.appendChild(actions);

        var footer = el("div", { className: "vg-cookie-banner-footer" });
        var customise = el(
            "button",
            { type: "button", className: "vg-cookie-btn-quiet" },
            COPY.customise
        );
        customise.addEventListener("click", function () {
            openPreferences();
        });
        footer.appendChild(customise);
        var links = policyLinks();
        if (links) footer.appendChild(links);
        banner.appendChild(footer);

        return banner;
    }

    function buildSwitch(def, checked) {
        var wrap = el("label", { className: "vg-cookie-switch" });
        var input = el("input", {
            type: "checkbox",
            className: "vg-cookie-switch-input",
            id: "vg-cookie-toggle-" + def.id
        });
        input.checked = checked === true;
        input.setAttribute("aria-describedby", "vg-cookie-desc-" + def.id);

        var track = el("span", {
            className: "vg-cookie-switch-track",
            "aria-hidden": "true"
        });
        var stateText = el(
            "span",
            { className: "vg-cookie-switch-state" },
            input.checked ? COPY.on : COPY.off
        );

        input.addEventListener("change", function () {
            stateText.textContent = input.checked ? COPY.on : COPY.off;
        });

        wrap.appendChild(input);
        wrap.appendChild(track);
        wrap.appendChild(stateText);
        state.inputs[def.id] = input;
        state.stateEls[def.id] = stateText;
        return wrap;
    }

    function buildCookieTable(list) {
        if (!list || !list.length) return null;
        var ul = el("ul", { className: "vg-cookie-inventory" });
        list.forEach(function (c) {
            var parts = [c.name, c.provider, c.purpose, c.duration].filter(
                Boolean
            );
            ul.appendChild(el("li", null, parts.join(" · ")));
        });
        return ul;
    }

    function buildModal(consent) {
        var overlay = el("div", { className: "vg-cookie-modal", hidden: "" });

        var panel = el("div", {
            className: "vg-cookie-modal-panel",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "vg-cookie-modal-title",
            "aria-describedby": "vg-cookie-modal-intro"
        });

        /* header */
        var header = el("div", { className: "vg-cookie-modal-header" });
        var close = el("button", {
            type: "button",
            className: "vg-cookie-modal-close",
            "aria-label": COPY.closeLabel
        });
        close.appendChild(svg(["M6 6l12 12", "M18 6L6 18"]));
        close.addEventListener("click", function () {
            closePreferences();
        });
        header.appendChild(close);
        header.appendChild(
            el(
                "h2",
                {
                    className: "vg-cookie-modal-title",
                    id: "vg-cookie-modal-title"
                },
                COPY.modalTitle
            )
        );
        header.appendChild(
            el(
                "p",
                {
                    className: "vg-cookie-modal-intro",
                    id: "vg-cookie-modal-intro"
                },
                COPY.modalIntro
            )
        );
        panel.appendChild(header);

        /* body */
        var body = el("div", { className: "vg-cookie-modal-body" });
        CATEGORY_DEFS.forEach(function (def) {
            var group = el("div", { className: "vg-cookie-group" });
            var head = el("div", { className: "vg-cookie-group-head" });
            head.appendChild(
                el("h3", { className: "vg-cookie-group-name" }, def.label)
            );

            if (def.locked) {
                head.appendChild(
                    el(
                        "span",
                        { className: "vg-cookie-group-locked" },
                        COPY.alwaysActive
                    )
                );
            } else {
                head.appendChild(buildSwitch(def, consent[def.id]));
            }
            group.appendChild(head);
            group.appendChild(
                el(
                    "p",
                    {
                        className: "vg-cookie-group-desc",
                        id: "vg-cookie-desc-" + def.id
                    },
                    def.description
                )
            );

            var table = buildCookieTable(COOKIE_CATEGORIES[def.id]);
            if (table) group.appendChild(table);

            body.appendChild(group);
        });
        panel.appendChild(body);

        /* footer */
        var footer = el("div", { className: "vg-cookie-modal-footer" });
        var reject = el(
            "button",
            {
                type: "button",
                className: "vg-cookie-btn vg-cookie-btn-secondary"
            },
            COPY.rejectAll
        );
        var acceptAllBtn = el(
            "button",
            {
                type: "button",
                className: "vg-cookie-btn vg-cookie-btn-secondary"
            },
            COPY.acceptAll
        );
        var save = el(
            "button",
            {
                type: "button",
                className: "vg-cookie-btn vg-cookie-btn-primary"
            },
            COPY.savePreferences
        );
        reject.addEventListener("click", function () {
            rejectAll();
        });
        acceptAllBtn.addEventListener("click", function () {
            acceptAll();
        });
        save.addEventListener("click", function () {
            var next = {};
            CATEGORY_DEFS.forEach(function (def) {
                next[def.id] = def.locked
                    ? true
                    : !!(state.inputs[def.id] && state.inputs[def.id].checked);
            });
            savePreferences(next);
        });
        footer.appendChild(reject);
        footer.appendChild(acceptAllBtn);
        footer.appendChild(save);
        panel.appendChild(footer);

        overlay.appendChild(panel);

        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) closePreferences();
        });

        return overlay;
    }

    function buildSettingsButton() {
        var btn = el("button", {
            type: "button",
            className: "vg-cookie-settings",
            hidden: ""
        });
        btn.appendChild(
            svg([
                "M12 2.5a9.5 9.5 0 1 0 9.5 9.5 3.2 3.2 0 0 1-4.6-3.6A3.2 3.2 0 0 1 12 2.5z",
                "M9 10.5h.01",
                "M14.5 14h.01",
                "M9.5 15.5h.01"
            ])
        );
        btn.appendChild(
            el("span", { className: "vg-cookie-settings-label" }, COPY.settingsButton)
        );
        btn.setAttribute("aria-label", COPY.settingsButton);
        btn.addEventListener("click", function () {
            openPreferences();
        });
        return btn;
    }

    /* ------------------------- show / hide ------------------------------- */

    function showBanner() {
        if (!state.bannerEl) return;
        state.bannerEl.hidden = false;
        /* next frame so the transition actually runs */
        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
                state.bannerEl.classList.add("vg-cookie-is-visible");
            });
        });
        log("Banner initialized");
    }

    function hideBanner() {
        if (!state.bannerEl) return;
        state.bannerEl.classList.remove("vg-cookie-is-visible");
        window.setTimeout(function () {
            if (state.bannerEl) state.bannerEl.hidden = true;
        }, 500);
    }

    function showSettingsButton() {
        if (!COOKIE_CONFIG.showSettingsButton || !state.settingsEl) return;
        state.settingsEl.hidden = false;
        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
                state.settingsEl.classList.add("vg-cookie-is-visible");
            });
        });
    }

    function focusables(container) {
        return Array.prototype.filter.call(
            container.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ),
            function (n) {
                return (
                    !n.disabled &&
                    n.getAttribute("aria-hidden") !== "true" &&
                    n.offsetParent !== null
                );
            }
        );
    }

    function onModalKeydown(e) {
        if (e.key === "Escape" || e.keyCode === 27) {
            e.stopPropagation();
            closePreferences();
            return;
        }
        if (e.key !== "Tab" && e.keyCode !== 9) return;

        var items = focusables(state.modalEl);
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function syncInputs() {
        var c = state.consent || defaultConsent();
        CATEGORY_DEFS.forEach(function (def) {
            var input = state.inputs[def.id];
            if (!input || def.locked) return;
            input.checked = c[def.id] === true;
            var stateText = state.stateEls[def.id];
            if (stateText) {
                stateText.textContent = input.checked ? COPY.on : COPY.off;
            }
        });
    }

    /* ============================ public ================================= */

    function getConsent() {
        var c = state.consent || defaultConsent();
        var out = {};
        CATEGORY_IDS.forEach(function (id) {
            out[id] = c[id] === true;
        });
        out.timestamp = c.timestamp || null;
        out.version = c.version || null;
        return out;
    }

    function commit(consent, closeUi) {
        var record = persist(consent);
        applyConsent(record);
        if (closeUi !== false) {
            hideBanner();
            closePreferences();
            showSettingsButton();
        }
        return record;
    }

    function acceptAll() {
        var next = {};
        CATEGORY_IDS.forEach(function (id) {
            next[id] = true;
        });
        log("Accept All");
        return commit(next);
    }

    function rejectAll() {
        var next = defaultConsent();
        CATEGORY_DEFS.forEach(function (c) {
            next[c.id] = c.locked === true;
        });
        log("Reject All");
        return commit(next);
    }

    function savePreferences(selection) {
        var next = {};
        CATEGORY_DEFS.forEach(function (def) {
            next[def.id] = def.locked
                ? true
                : !!(selection && selection[def.id] === true);
        });
        log("Save Preferences", next);
        return commit(next);
    }

    function withdrawConsent() {
        var next = defaultConsent();
        CATEGORY_DEFS.forEach(function (c) {
            next[c.id] = c.locked === true;
        });
        persist(next);
        pushConsentUpdate(next);
        deleteCookie(COOKIE_CONFIG.cookieName);
        try {
            window.localStorage.removeItem(COOKIE_CONFIG.cookieName);
        } catch (e) {
            /* ignore */
        }
        state.consent = null;
        syncInputs();
        closePreferences();
        if (state.settingsEl) {
            state.settingsEl.classList.remove("vg-cookie-is-visible");
            state.settingsEl.hidden = true;
        }
        showBanner();
        warn(
            "Consent withdrawn. Signals are set to denied, but scripts that " +
                "already executed in this page view cannot be unloaded — " +
                "reload the page to fully clear them."
        );
        return getConsent();
    }

    function openPreferences() {
        if (!state.modalEl) return;
        state.lastFocused = document.activeElement;
        syncInputs();
        state.modalEl.hidden = false;
        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
                state.modalEl.classList.add("vg-cookie-is-visible");
                var items = focusables(state.modalEl);
                if (items.length) items[0].focus();
            });
        });
        state.keydownBound = onModalKeydown;
        document.addEventListener("keydown", state.keydownBound, true);
        log("Preferences modal opened");
    }

    function closePreferences() {
        if (!state.modalEl || state.modalEl.hidden) return;
        state.modalEl.classList.remove("vg-cookie-is-visible");
        if (state.keydownBound) {
            document.removeEventListener("keydown", state.keydownBound, true);
            state.keydownBound = null;
        }
        window.setTimeout(function () {
            if (state.modalEl) state.modalEl.hidden = true;
        }, 400);
        if (state.lastFocused && state.lastFocused.focus) {
            try {
                state.lastFocused.focus();
            } catch (e) {
                /* element may have been removed */
            }
        }
    }

    function onChange(fn) {
        if (typeof fn === "function") state.listeners.push(fn);
    }

    function init() {
        if (state.initialised) return;
        if (!document.body) {
            document.addEventListener("DOMContentLoaded", init);
            return;
        }
        state.initialised = true;

        var stored = restore();
        state.consent = stored;

        state.rootEl = buildRoot();
        state.bannerEl = buildBanner();
        state.bannerEl.hidden = true;
        state.modalEl = buildModal(stored || defaultConsent());
        state.settingsEl = buildSettingsButton();

        state.rootEl.appendChild(state.bannerEl);
        state.rootEl.appendChild(state.modalEl);
        state.rootEl.appendChild(state.settingsEl);

        if (stored) {
            log("Consent loaded", stored);
            applyConsent(stored);
            showSettingsButton();
        } else {
            log("No valid consent found — requesting");
            /* Defaults are already denied via the head snippet; nothing to do
               but ask. No non-essential script runs before a choice. */
            showBanner();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    return {
        init: init,
        acceptAll: acceptAll,
        rejectAll: rejectAll,
        savePreferences: savePreferences,
        openPreferences: openPreferences,
        closePreferences: closePreferences,
        getConsent: getConsent,
        withdrawConsent: withdrawConsent,
        onChange: onChange,
        version: COOKIE_CONSENT_VERSION,
        config: COOKIE_CONFIG
    };
})(window, document);
