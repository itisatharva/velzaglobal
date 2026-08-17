window.VelzaCookieConsent = (function (window2, document2) {
    "use strict";
    var COOKIE_CONSENT_VERSION = "1.0",
        COOKIE_DEBUG = !1,
        COOKIE_CONFIG = {
            cookieName: "velza_cookie_consent",
            storageDays: 395,
            analyticsId: "",
            enableAnalytics: !0,
            enableGtmConsentMode: !0,
            privacyPolicyUrl: "/privacypolicy",
            cookiePolicyUrl: "",
            showSettingsButton: !0,
        },
        COOKIE_CATEGORIES = {
            necessary: [],
            preferences: [],
            analytics: [],
            marketing: [],
        },
        CATEGORY_DEFS = [
            {
                id: "necessary",
                label: "Necessary Cookies",
                description:
                    "Required for basic website functionality, security and remembering your cookie choice. These cannot be switched off.",
                locked: !0,
                defaultValue: !0,
            },
            {
                id: "preferences",
                label: "Preferences Cookies",
                description:
                    "Remember choices such as your regional site and other display settings so you do not have to set them again.",
                locked: !1,
                defaultValue: !1,
            },
            {
                id: "analytics",
                label: "Analytics Cookies",
                description:
                    "Help us understand how the site is used \u2014 which pages are visited and where visitors encounter problems \u2014 so we can improve performance.",
                locked: !1,
                defaultValue: !1,
            },
            {
                id: "marketing",
                label: "Marketing Cookies",
                description:
                    "Used to measure campaign performance and show relevant advertising on third-party platforms where applicable.",
                locked: !1,
                defaultValue: !1,
            },
        ],
        CONSENT_MODE_MAP = {
            necessary: ["security_storage"],
            preferences: ["functionality_storage", "personalization_storage"],
            analytics: ["analytics_storage"],
            marketing: ["ad_storage", "ad_user_data", "ad_personalization"],
        },
        COPY = {
            bannerEyebrow: "Your Privacy Matters",
            bannerTitle: "Your Privacy Matters",
            bannerText:
                "We use cookies and similar technologies to provide essential website functionality, understand how visitors interact with our website, and improve your experience. You can manage your preferences at any time.",
            acceptAll: "Accept All",
            rejectAll: "Reject All",
            customise: "Cookie Settings",
            modalTitle: "Cookie Preferences",
            modalIntro:
                "We use cookies to improve your experience and understand how our website is used. Necessary cookies are always active. Everything else is off until you turn it on.",
            savePreferences: "Save Preferences",
            alwaysActive: "Always Active",
            on: "On",
            off: "Off",
            settingsButton: "Cookie Settings",
            privacyPolicy: "Privacy Policy",
            cookiePolicy: "Cookie Policy",
            closeLabel: "Close cookie preferences",
        },
        CATEGORY_IDS = CATEGORY_DEFS.map(function (c) {
            return c.id;
        }),
        state = {
            consent: null,
            initialised: !1,
            bannerEl: null,
            modalEl: null,
            settingsEl: null,
            rootEl: null,
            inputs: {},
            stateEls: {},
            lastFocused: null,
            keydownBound: null,
            listeners: [],
            loaded: { analytics: !1, marketing: !1 },
        };
    function log() {
        if (!(!COOKIE_DEBUG || !window2.console || !window2.console.log)) {
            var args = Array.prototype.slice.call(arguments);
            (args.unshift("[Velza Cookie]"),
                window2.console.log.apply(window2.console, args));
        }
    }
    function warn() {
        if (!(!window2.console || !window2.console.warn)) {
            var args = Array.prototype.slice.call(arguments);
            (args.unshift("[Velza Cookie]"),
                window2.console.warn.apply(window2.console, args));
        }
    }
    function el(tag, attrs, text) {
        var node = document2.createElement(tag);
        return (
            attrs &&
                Object.keys(attrs).forEach(function (k) {
                    attrs[k] === null ||
                        attrs[k] === !1 ||
                        (k === "className"
                            ? (node.className = attrs[k])
                            : node.setAttribute(k, attrs[k]));
                }),
            text != null && (node.textContent = String(text)),
            node
        );
    }
    function svg(paths, viewBox) {
        var s = document2.createElementNS("http://www.w3.org/2000/svg", "svg");
        return (
            s.setAttribute("viewBox", viewBox || "0 0 24 24"),
            s.setAttribute("aria-hidden", "true"),
            s.setAttribute("focusable", "false"),
            paths.forEach(function (d) {
                var p = document2.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path",
                );
                (p.setAttribute("d", d), s.appendChild(p));
            }),
            s
        );
    }
    function defaultConsent() {
        var o = {};
        return (
            CATEGORY_DEFS.forEach(function (c) {
                o[c.id] = c.locked ? !0 : c.defaultValue === !0;
            }),
            o
        );
    }
    function writeCookie(name, value, days) {
        var parts = [
            name + "=" + encodeURIComponent(value),
            "path=/",
            "SameSite=Lax",
        ];
        if (days) {
            var d = new Date();
            (d.setTime(d.getTime() + days * 864e5),
                parts.push("expires=" + d.toUTCString()),
                parts.push("max-age=" + days * 86400));
        }
        window2.location.protocol === "https:" && parts.push("Secure");
        try {
            document2.cookie = parts.join("; ");
        } catch {}
    }
    function readCookie(name) {
        for (
            var target = name + "=",
                all = String(document2.cookie || "").split(";"),
                i = 0;
            i < all.length;
            i++
        ) {
            var c = all[i].trim();
            if (c.indexOf(target) === 0)
                return decodeURIComponent(c.substring(target.length));
        }
        return null;
    }
    function deleteCookie(name) {
        writeCookie(name, "", -1);
    }
    function persist(consent) {
        var record = {};
        (CATEGORY_IDS.forEach(function (id) {
            record[id] = consent[id] === !0;
        }),
            CATEGORY_DEFS.forEach(function (c) {
                c.locked && (record[c.id] = !0);
            }),
            (record.timestamp = new Date().toISOString()),
            (record.version = COOKIE_CONSENT_VERSION));
        var raw = JSON.stringify(record);
        writeCookie(COOKIE_CONFIG.cookieName, raw, COOKIE_CONFIG.storageDays);
        try {
            window2.localStorage.setItem(COOKIE_CONFIG.cookieName, raw);
        } catch {}
        return ((state.consent = record), log("Consent saved", record), record);
    }
    function restore() {
        var raw = readCookie(COOKIE_CONFIG.cookieName);
        if (!raw)
            try {
                raw = window2.localStorage.getItem(COOKIE_CONFIG.cookieName);
            } catch {
                raw = null;
            }
        if (!raw) return null;
        var parsed;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return (
                warn("Stored consent was unreadable and has been discarded."),
                null
            );
        }
        if (!parsed || typeof parsed != "object") return null;
        if (parsed.version !== COOKIE_CONSENT_VERSION)
            return (
                log(
                    "Consent version changed (" +
                        parsed.version +
                        " -> " +
                        COOKIE_CONSENT_VERSION +
                        "). Re-asking.",
                ),
                null
            );
        var normalised = {};
        return (
            CATEGORY_DEFS.forEach(function (c) {
                normalised[c.id] = c.locked ? !0 : parsed[c.id] === !0;
            }),
            (normalised.timestamp = parsed.timestamp),
            (normalised.version = parsed.version),
            normalised
        );
    }
    function dataLayerPush() {
        ((window2.dataLayer = window2.dataLayer || []),
            window2.dataLayer.push(arguments));
    }
    function pushConsentUpdate(consent) {
        if (COOKIE_CONFIG.enableGtmConsentMode) {
            var signals = { wait_for_update: 500 };
            (CATEGORY_IDS.forEach(function (id) {
                var keys = CONSENT_MODE_MAP[id] || [];
                keys.forEach(function (k) {
                    signals[k] = consent[id] ? "granted" : "denied";
                });
            }),
                delete signals.wait_for_update,
                dataLayerPush("consent", "update", signals),
                (window2.dataLayer = window2.dataLayer || []),
                window2.dataLayer.push({
                    event: "velza_consent_update",
                    velza_consent_analytics: consent.analytics
                        ? "granted"
                        : "denied",
                    velza_consent_marketing: consent.marketing
                        ? "granted"
                        : "denied",
                    velza_consent_preferences: consent.preferences
                        ? "granted"
                        : "denied",
                }),
                log("Consent Mode updated", signals));
        }
    }
    function activateGatedScripts(consent) {
        var nodes = document2.querySelectorAll(
            'script[type="text/plain"][data-cookie-category]',
        );
        Array.prototype.forEach.call(nodes, function (node) {
            var cat = node.getAttribute("data-cookie-category");
            if (
                !(!cat || consent[cat] !== !0) &&
                node.getAttribute("data-cookie-activated") !== "true"
            ) {
                var fresh = document2.createElement("script");
                Array.prototype.forEach.call(node.attributes, function (attr) {
                    attr.name !== "type" &&
                        attr.name !== "data-cookie-category" &&
                        attr.name !== "data-cookie-activated" &&
                        attr.name !== "data-cookie-src" &&
                        fresh.setAttribute(attr.name, attr.value);
                });
                var src = node.getAttribute("data-cookie-src") || node.src;
                (src
                    ? (fresh.src = src)
                    : (fresh.text = node.textContent || ""),
                    node.setAttribute("data-cookie-activated", "true"),
                    node.parentNode.insertBefore(fresh, node.nextSibling),
                    log('Activated gated script for "' + cat + '"'));
            }
        });
    }
    function loadAnalytics() {
        if (!state.loaded.analytics) {
            if (!COOKIE_CONFIG.enableAnalytics) {
                log("Analytics disabled by configuration");
                return;
            }
            if (!COOKIE_CONFIG.analyticsId) {
                log(
                    "Analytics consent granted, but analyticsId is empty \u2014 nothing loaded directly. If GA4 lives in GTM, that is correct.",
                );
                return;
            }
            COOKIE_CONFIG.enableGtmConsentMode &&
                warn(
                    "analyticsId is set AND enableGtmConsentMode is true. If GA4 also fires inside GTM you will double-count pageviews. Pick one delivery path.",
                );
            var id = COOKIE_CONFIG.analyticsId,
                s = document2.createElement("script");
            ((s.async = !0),
                (s.src =
                    "https://www.googletagmanager.com/gtag/js?id=" +
                    encodeURIComponent(id)),
                document2.head.appendChild(s),
                dataLayerPush("js", new Date()),
                dataLayerPush("config", id, { anonymize_ip: !0 }),
                (state.loaded.analytics = !0),
                log("Analytics enabled (" + id + ")"));
        }
    }
    function loadMarketingScripts() {
        state.loaded.marketing ||
            ((state.loaded.marketing = !0),
            log("Marketing enabled \u2014 no marketing vendors configured"));
    }
    function applyConsent(consent) {
        (pushConsentUpdate(consent),
            activateGatedScripts(consent),
            consent.analytics === !0
                ? loadAnalytics()
                : log("Analytics disabled"),
            consent.marketing === !0
                ? loadMarketingScripts()
                : log("Marketing disabled"),
            state.listeners.forEach(function (fn) {
                try {
                    fn(getConsent());
                } catch (e) {
                    warn("onChange listener threw", e);
                }
            }));
    }
    function buildRoot() {
        var root = el("div", {
            className: "vg-cookie-consent",
            "data-vg-cookie-root": "true",
        });
        return (document2.body.appendChild(root), root);
    }
    function policyLinks() {
        var wrap = el("div", { className: "vg-cookie-links" });
        return (
            COOKIE_CONFIG.privacyPolicyUrl &&
                wrap.appendChild(
                    el(
                        "a",
                        { href: COOKIE_CONFIG.privacyPolicyUrl },
                        COPY.privacyPolicy,
                    ),
                ),
            COOKIE_CONFIG.cookiePolicyUrl &&
                wrap.appendChild(
                    el(
                        "a",
                        { href: COOKIE_CONFIG.cookiePolicyUrl },
                        COPY.cookiePolicy,
                    ),
                ),
            wrap.childNodes.length ? wrap : null
        );
    }
    function buildBanner() {
        var banner = el("section", {
            className: "vg-cookie-banner",
            role: "dialog",
            "aria-modal": "false",
            "aria-labelledby": "vg-cookie-banner-title",
            "aria-describedby": "vg-cookie-banner-text",
            tabindex: "-1",
        });
        (banner.appendChild(
            el("p", { className: "vg-cookie-eyebrow" }, COPY.bannerEyebrow),
        ),
            banner.appendChild(
                el(
                    "h2",
                    {
                        className: "vg-cookie-banner-title",
                        id: "vg-cookie-banner-title",
                    },
                    COPY.bannerTitle,
                ),
            ),
            banner.appendChild(
                el(
                    "p",
                    {
                        className: "vg-cookie-banner-text",
                        id: "vg-cookie-banner-text",
                    },
                    COPY.bannerText,
                ),
            ));
        var actions = el("div", { className: "vg-cookie-banner-actions" }),
            reject = el(
                "button",
                {
                    type: "button",
                    className: "vg-cookie-btn vg-cookie-btn-secondary",
                },
                COPY.rejectAll,
            ),
            accept = el(
                "button",
                {
                    type: "button",
                    className: "vg-cookie-btn vg-cookie-btn-primary",
                },
                COPY.acceptAll,
            );
        (reject.addEventListener("click", function () {
            rejectAll();
        }),
            accept.addEventListener("click", function () {
                acceptAll();
            }),
            actions.appendChild(reject),
            actions.appendChild(accept),
            banner.appendChild(actions));
        var footer = el("div", { className: "vg-cookie-banner-footer" }),
            customise = el(
                "button",
                { type: "button", className: "vg-cookie-btn-quiet" },
                COPY.customise,
            );
        (customise.addEventListener("click", function () {
            openPreferences();
        }),
            footer.appendChild(customise));
        var links = policyLinks();
        return (
            links && footer.appendChild(links),
            banner.appendChild(footer),
            banner
        );
    }
    function buildSwitch(def, checked) {
        var wrap = el("label", { className: "vg-cookie-switch" }),
            input = el("input", {
                type: "checkbox",
                className: "vg-cookie-switch-input",
                id: "vg-cookie-toggle-" + def.id,
            });
        ((input.checked = checked === !0),
            input.setAttribute("aria-describedby", "vg-cookie-desc-" + def.id));
        var track = el("span", {
                className: "vg-cookie-switch-track",
                "aria-hidden": "true",
            }),
            stateText = el(
                "span",
                { className: "vg-cookie-switch-state" },
                input.checked ? COPY.on : COPY.off,
            );
        return (
            input.addEventListener("change", function () {
                stateText.textContent = input.checked ? COPY.on : COPY.off;
            }),
            wrap.appendChild(input),
            wrap.appendChild(track),
            wrap.appendChild(stateText),
            (state.inputs[def.id] = input),
            (state.stateEls[def.id] = stateText),
            wrap
        );
    }
    function buildCookieTable(list) {
        if (!list || !list.length) return null;
        var ul = el("ul", { className: "vg-cookie-inventory" });
        return (
            list.forEach(function (c) {
                var parts = [c.name, c.provider, c.purpose, c.duration].filter(
                    Boolean,
                );
                ul.appendChild(el("li", null, parts.join(" \xB7 ")));
            }),
            ul
        );
    }
    function buildModal(consent) {
        var overlay = el("div", { className: "vg-cookie-modal", hidden: "" }),
            panel = el("div", {
                className: "vg-cookie-modal-panel",
                role: "dialog",
                "aria-modal": "true",
                "aria-labelledby": "vg-cookie-modal-title",
                "aria-describedby": "vg-cookie-modal-intro",
            }),
            header = el("div", { className: "vg-cookie-modal-header" }),
            close = el("button", {
                type: "button",
                className: "vg-cookie-modal-close",
                "aria-label": COPY.closeLabel,
            });
        (close.appendChild(svg(["M6 6l12 12", "M18 6L6 18"])),
            close.addEventListener("click", function () {
                closePreferences();
            }),
            header.appendChild(close),
            header.appendChild(
                el(
                    "h2",
                    {
                        className: "vg-cookie-modal-title",
                        id: "vg-cookie-modal-title",
                    },
                    COPY.modalTitle,
                ),
            ),
            header.appendChild(
                el(
                    "p",
                    {
                        className: "vg-cookie-modal-intro",
                        id: "vg-cookie-modal-intro",
                    },
                    COPY.modalIntro,
                ),
            ),
            panel.appendChild(header));
        var body = el("div", { className: "vg-cookie-modal-body" });
        (CATEGORY_DEFS.forEach(function (def) {
            var group = el("div", { className: "vg-cookie-group" }),
                head = el("div", { className: "vg-cookie-group-head" });
            (head.appendChild(
                el("h3", { className: "vg-cookie-group-name" }, def.label),
            ),
                def.locked
                    ? head.appendChild(
                          el(
                              "span",
                              { className: "vg-cookie-group-locked" },
                              COPY.alwaysActive,
                          ),
                      )
                    : head.appendChild(buildSwitch(def, consent[def.id])),
                group.appendChild(head),
                group.appendChild(
                    el(
                        "p",
                        {
                            className: "vg-cookie-group-desc",
                            id: "vg-cookie-desc-" + def.id,
                        },
                        def.description,
                    ),
                ));
            var table = buildCookieTable(COOKIE_CATEGORIES[def.id]);
            (table && group.appendChild(table), body.appendChild(group));
        }),
            panel.appendChild(body));
        var footer = el("div", { className: "vg-cookie-modal-footer" }),
            reject = el(
                "button",
                {
                    type: "button",
                    className: "vg-cookie-btn vg-cookie-btn-secondary",
                },
                COPY.rejectAll,
            ),
            acceptAllBtn = el(
                "button",
                {
                    type: "button",
                    className: "vg-cookie-btn vg-cookie-btn-secondary",
                },
                COPY.acceptAll,
            ),
            save = el(
                "button",
                {
                    type: "button",
                    className: "vg-cookie-btn vg-cookie-btn-primary",
                },
                COPY.savePreferences,
            );
        return (
            reject.addEventListener("click", function () {
                rejectAll();
            }),
            acceptAllBtn.addEventListener("click", function () {
                acceptAll();
            }),
            save.addEventListener("click", function () {
                var next = {};
                (CATEGORY_DEFS.forEach(function (def) {
                    next[def.id] = def.locked
                        ? !0
                        : !!(
                              state.inputs[def.id] &&
                              state.inputs[def.id].checked
                          );
                }),
                    savePreferences(next));
            }),
            footer.appendChild(reject),
            footer.appendChild(acceptAllBtn),
            footer.appendChild(save),
            panel.appendChild(footer),
            overlay.appendChild(panel),
            overlay.addEventListener("click", function (e) {
                e.target === overlay && closePreferences();
            }),
            overlay
        );
    }
    function buildSettingsButton() {
        var btn = el("button", {
            type: "button",
            className: "vg-cookie-settings",
            hidden: "",
        });
        return (
            btn.appendChild(
                svg([
                    "M12 2.5a9.5 9.5 0 1 0 9.5 9.5 3.2 3.2 0 0 1-4.6-3.6A3.2 3.2 0 0 1 12 2.5z",
                    "M9 10.5h.01",
                    "M14.5 14h.01",
                    "M9.5 15.5h.01",
                ]),
            ),
            btn.appendChild(
                el(
                    "span",
                    { className: "vg-cookie-settings-label" },
                    COPY.settingsButton,
                ),
            ),
            btn.setAttribute("aria-label", COPY.settingsButton),
            btn.addEventListener("click", function () {
                openPreferences();
            }),
            btn
        );
    }
    function showBanner() {
        state.bannerEl &&
            ((state.bannerEl.hidden = !1),
            window2.requestAnimationFrame(function () {
                window2.requestAnimationFrame(function () {
                    state.bannerEl.classList.add("vg-cookie-is-visible");
                });
            }),
            log("Banner initialized"));
    }
    function hideBanner() {
        state.bannerEl &&
            (state.bannerEl.classList.remove("vg-cookie-is-visible"),
            window2.setTimeout(function () {
                state.bannerEl && (state.bannerEl.hidden = !0);
            }, 500));
    }
    function showSettingsButton() {
        !COOKIE_CONFIG.showSettingsButton ||
            !state.settingsEl ||
            ((state.settingsEl.hidden = !1),
            window2.requestAnimationFrame(function () {
                window2.requestAnimationFrame(function () {
                    state.settingsEl.classList.add("vg-cookie-is-visible");
                });
            }));
    }
    function focusables(container) {
        return Array.prototype.filter.call(
            container.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            ),
            function (n) {
                return (
                    !n.disabled &&
                    n.getAttribute("aria-hidden") !== "true" &&
                    n.offsetParent !== null
                );
            },
        );
    }
    function onModalKeydown(e) {
        if (e.key === "Escape" || e.keyCode === 27) {
            (e.stopPropagation(), closePreferences());
            return;
        }
        if (!(e.key !== "Tab" && e.keyCode !== 9)) {
            var items = focusables(state.modalEl);
            if (items.length) {
                var first = items[0],
                    last = items[items.length - 1];
                e.shiftKey && document2.activeElement === first
                    ? (e.preventDefault(), last.focus())
                    : !e.shiftKey &&
                      document2.activeElement === last &&
                      (e.preventDefault(), first.focus());
            }
        }
    }
    function syncInputs() {
        var c = state.consent || defaultConsent();
        CATEGORY_DEFS.forEach(function (def) {
            var input = state.inputs[def.id];
            if (!(!input || def.locked)) {
                input.checked = c[def.id] === !0;
                var stateText = state.stateEls[def.id];
                stateText &&
                    (stateText.textContent = input.checked
                        ? COPY.on
                        : COPY.off);
            }
        });
    }
    function getConsent() {
        var c = state.consent || defaultConsent(),
            out = {};
        return (
            CATEGORY_IDS.forEach(function (id) {
                out[id] = c[id] === !0;
            }),
            (out.timestamp = c.timestamp || null),
            (out.version = c.version || null),
            out
        );
    }
    function commit(consent, closeUi) {
        var record = persist(consent);
        return (
            applyConsent(record),
            closeUi !== !1 &&
                (hideBanner(), closePreferences(), showSettingsButton()),
            record
        );
    }
    function acceptAll() {
        var next = {};
        return (
            CATEGORY_IDS.forEach(function (id) {
                next[id] = !0;
            }),
            log("Accept All"),
            commit(next)
        );
    }
    function rejectAll() {
        var next = defaultConsent();
        return (
            CATEGORY_DEFS.forEach(function (c) {
                next[c.id] = c.locked === !0;
            }),
            log("Reject All"),
            commit(next)
        );
    }
    function savePreferences(selection) {
        var next = {};
        return (
            CATEGORY_DEFS.forEach(function (def) {
                next[def.id] = def.locked
                    ? !0
                    : !!(selection && selection[def.id] === !0);
            }),
            log("Save Preferences", next),
            commit(next)
        );
    }
    function withdrawConsent() {
        var next = defaultConsent();
        (CATEGORY_DEFS.forEach(function (c) {
            next[c.id] = c.locked === !0;
        }),
            persist(next),
            pushConsentUpdate(next),
            deleteCookie(COOKIE_CONFIG.cookieName));
        try {
            window2.localStorage.removeItem(COOKIE_CONFIG.cookieName);
        } catch {}
        return (
            (state.consent = null),
            syncInputs(),
            closePreferences(),
            state.settingsEl &&
                (state.settingsEl.classList.remove("vg-cookie-is-visible"),
                (state.settingsEl.hidden = !0)),
            showBanner(),
            warn(
                "Consent withdrawn. Signals are set to denied, but scripts that already executed in this page view cannot be unloaded \u2014 reload the page to fully clear them.",
            ),
            getConsent()
        );
    }
    function openPreferences() {
        state.modalEl &&
            ((state.lastFocused = document2.activeElement),
            syncInputs(),
            (state.modalEl.hidden = !1),
            window2.requestAnimationFrame(function () {
                window2.requestAnimationFrame(function () {
                    state.modalEl.classList.add("vg-cookie-is-visible");
                    var items = focusables(state.modalEl);
                    items.length && items[0].focus();
                });
            }),
            (state.keydownBound = onModalKeydown),
            document2.addEventListener("keydown", state.keydownBound, !0),
            log("Preferences modal opened"));
    }
    function closePreferences() {
        if (
            !(!state.modalEl || state.modalEl.hidden) &&
            (state.modalEl.classList.remove("vg-cookie-is-visible"),
            state.keydownBound &&
                (document2.removeEventListener(
                    "keydown",
                    state.keydownBound,
                    !0,
                ),
                (state.keydownBound = null)),
            window2.setTimeout(function () {
                state.modalEl && (state.modalEl.hidden = !0);
            }, 400),
            state.lastFocused && state.lastFocused.focus)
        )
            try {
                state.lastFocused.focus();
            } catch {}
    }
    function onChange(fn) {
        typeof fn == "function" && state.listeners.push(fn);
    }
    function init() {
        if (!state.initialised) {
            if (!document2.body) {
                document2.addEventListener("DOMContentLoaded", init);
                return;
            }
            state.initialised = !0;
            var stored = restore();
            ((state.consent = stored),
                (state.rootEl = buildRoot()),
                (state.bannerEl = buildBanner()),
                (state.bannerEl.hidden = !0),
                (state.modalEl = buildModal(stored || defaultConsent())),
                (state.settingsEl = buildSettingsButton()),
                state.rootEl.appendChild(state.bannerEl),
                state.rootEl.appendChild(state.modalEl),
                state.rootEl.appendChild(state.settingsEl),
                stored
                    ? (log("Consent loaded", stored),
                      applyConsent(stored),
                      showSettingsButton())
                    : (log("No valid consent found \u2014 requesting"),
                      showBanner()));
        }
    }
    return (
        document2.readyState === "loading"
            ? document2.addEventListener("DOMContentLoaded", init)
            : init(),
        {
            init,
            acceptAll,
            rejectAll,
            savePreferences,
            openPreferences,
            closePreferences,
            getConsent,
            withdrawConsent,
            onChange,
            version: COOKIE_CONSENT_VERSION,
            config: COOKIE_CONFIG,
        }
    );
})(window, document);
