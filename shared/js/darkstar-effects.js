(function (window, document) {
    "use strict";

    if (window.VGDarkstarEffects && window.VGDarkstarEffects.initialized) {
        return;
    }

    var root = document.documentElement;

    var THEME_OWNED = [
        '[class*="sk__fade-in-"]',
        ".cover-text-wrapper",
        ".animated-element",
        ".sk__feature-col",
        ".sk__imagebox",
        ".sk__featureboxes",
        ".sk__featurebox-col",
        ".sk__counter",
        ".sk__animated-headline",
        ".sk__parallax-header-image",
        ".sk__parallax-background-section",
        ".sk__parallax-background-element",
        ".sk__parallax-container",
        ".sk__hero-parallax-strip-vertical",
        ".sk__parallax-hero-video",
        ".sk__layered-parallax-element",
        ".sk__portfolio-wrapper",
        ".sk__portfolio-item",
        ".static-simple-footer",
        ".sk__body-section",
        ".sk__iconbox",
        ".sk__partners",
        ".fancy-gradient-text-box",
        ".about-right-image",
        ".about-right-image-subwrap",
        ".sk__rectangles-left-parallax-layers",
        ".sk__rectangles-full-left-parallax-layers",
        ".slick-slide",
        ".carousel-item",
        ".leaflet-container",
    ].join(",");

    var THEME_OWNED_ANCESTORS = [
        ".cover-text-wrapper",
        ".carousel",
        ".sk__hero-section",
        ".sk__portfolio-wrapper",
        ".slick-slider",
        ".sk__project-header",
        ".sk__project-body-info-col",
        ".sk__halfscreen-text-col",
        ".sk__featureboxes",
        ".sk__partners",
        ".fancy-gradient-text-box",
        ".sk__reveal-all-wrapped-text",
        ".sk__reveal-header-text",
        ".static-simple-footer",
        ".sk__master-curtain",
        ".leaflet-container",
        "footer",
    ].join(",");

    var EASE = "power3.out";
    var DEFAULT_DURATION = 1.1;
    var DEFAULT_EACH = 0.1;
    var START = "top 88%";

    // Longer, softer timing for text so it glides in rather than pops.
    function durationFor(type) {
        if (prefersReducedMotion()) return 1.3;
        if (type === "text-up") return 1.5;
        if (type === "reveal-up") return 1.6;
        if (type === "image-reveal") return 1.4;
        return DEFAULT_DURATION;
    }

    var reduceQuery = window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    var mobileQuery = window.matchMedia
        ? window.matchMedia("(max-width: 767px)")
        : null;
    var parallaxQuery = window.matchMedia
        ? window.matchMedia("(min-width: 768px)")
        : null;

    var state = {
        initialized: false,
        triggers: [],
        parallax: [],
        created: 0,
        refreshTimer: 0,
    };

    function prefersReducedMotion() {
        return !!(reduceQuery && reduceQuery.matches);
    }

    function isMobile() {
        return !!(mobileQuery && mobileQuery.matches);
    }

    function num(value, fallback) {
        var n = parseFloat(value);
        return isNaN(n) ? fallback : n;
    }

    function toArray(list) {
        return Array.prototype.slice.call(list || []);
    }

    function isThemeOwned(el) {
        if (el.matches(THEME_OWNED)) return true;
        var parent = el.parentElement;
        return !!(parent && parent.closest(THEME_OWNED_ANCESTORS));
    }

    function warnSkip(el) {
        if (window.console && console.warn) {
            console.warn(
                "[DarkStar Effects] skipped an element already animated by theme.js:",
                el,
            );
        }
    }

    // Starting pose per animation type. Horizontal offsets turn vertical on
    // phones so nothing can push past the viewport edge.
    function fromVars(type) {
        // Reduced motion: fade only, nothing slides, zooms or unmasks.
        if (prefersReducedMotion()) return { opacity: 0 };
        var mobile = isMobile(),
            dy = mobile ? 24 : 40,
            dx = mobile ? 0 : 36;
        switch (type) {
            case "text-up":
                // Short, soft rise for headings and lines of card text.
                return { opacity: 0, y: mobile ? 10 : 16 };
            case "fade-down":
                return { opacity: 0, y: -dy };
            case "fade-left":
                return mobile ? { opacity: 0, y: dy } : { opacity: 0, x: dx };
            case "fade-right":
                return mobile ? { opacity: 0, y: dy } : { opacity: 0, x: -dx };
            case "zoom-in":
                return { opacity: 0, scale: mobile ? 0.97 : 0.94 };
            case "reveal-up":
                return {
                    clipPath: "inset(100% 0% 0% 0%)",
                    y: mobile ? 16 : 28,
                };
            case "image-reveal":
                // Scale starts below 1: clip-path hides paint but not the
                // scaled box, so scaling up would add horizontal overflow.
                return {
                    clipPath: "inset(100% 0% 0% 0%)",
                    scale: mobile ? 0.98 : 0.96,
                };
            case "fade-up":
            default:
                return { opacity: 0, y: dy };
        }
    }

    function toVars(type) {
        var vars = { opacity: 1, x: 0, y: 0, scale: 1 };
        if (type === "reveal-up" || type === "image-reveal") {
            vars.clipPath = "inset(0% 0% 0% 0%)";
        }
        return vars;
    }

    // A running CSS transition on transform/opacity would fight GSAP's
    // per-frame updates, so it is paused inline and restored afterwards.
    function holdTransitions(els) {
        return els.map(function (el) {
            var saved = el.style.transition;
            el.style.transition = "none";
            return saved;
        });
    }

    function releaseTransitions(els, saved) {
        els.forEach(function (el, i) {
            el.style.transition = saved[i];
        });
    }

    function markRevealed(els) {
        els.forEach(function (el) {
            el.classList.add("ds-revealed");
        });
    }

    function reveal(targets, type, options) {
        var els = toArray(targets),
            saved = holdTransitions(els),
            vars = toVars(type);
        vars.duration = options.duration;
        vars.delay = options.delay;
        vars.ease = prefersReducedMotion()
            ? "sine.out"
            : type === "image-reveal"
              ? "power4.out"
              : type === "text-up" || type === "reveal-up"
                ? "power2.out"
                : EASE;
        if (options.each) vars.stagger = options.each;
        vars.clearProps = "transform,opacity,clipPath";
        vars.onComplete = function () {
            releaseTransitions(els, saved);
        };
        // Mark first so the CSS pre-reveal state stops applying; GSAP holds
        // the element at its starting pose from here on.
        gsap.set(els, fromVars(type));
        markRevealed(els);
        return gsap.to(els, vars);
    }

    // The record exists before ScrollTrigger.create() because create() fires
    // onEnter synchronously for elements already past their start point.
    function addTrigger(trigger, onEnter) {
        var record = { done: false, st: null };
        record.fire = function () {
            if (record.done) return;
            record.done = true;
            onEnter();
        };
        state.triggers.push(record);
        record.st = ScrollTrigger.create({
            trigger: trigger,
            start: START,
            once: true,
            onEnter: record.fire,
        });
        state.created++;
        return record;
    }

    function setupSingles() {
        toArray(document.querySelectorAll("[data-ds-anim]")).forEach(
            function (el) {
                if (isThemeOwned(el)) {
                    el.removeAttribute("data-ds-anim");
                    warnSkip(el);
                    return;
                }
                var type = el.getAttribute("data-ds-anim"),
                    options = {
                        duration: num(
                            el.getAttribute("data-ds-duration"),
                            durationFor(type),
                        ),
                        delay: num(el.getAttribute("data-ds-delay"), 0),
                    };
                addTrigger(el, function () {
                    reveal([el], type, options);
                });
            },
        );
    }

    function setupStaggers() {
        toArray(document.querySelectorAll("[data-ds-stagger]")).forEach(
            function (group) {
                var selector = group.getAttribute("data-ds-items"),
                    items = selector
                        ? toArray(group.querySelectorAll(selector))
                        : toArray(group.children);
                items = items.filter(function (item) {
                    if (isThemeOwned(item)) {
                        warnSkip(item);
                        return false;
                    }
                    return true;
                });
                if (!items.length || isThemeOwned(group)) {
                    group.removeAttribute("data-ds-stagger");
                    return;
                }
                items.forEach(function (item) {
                    item.classList.add("ds-item");
                });
                var type = group.getAttribute("data-ds-stagger"),
                    options = {
                        duration: num(
                            group.getAttribute("data-ds-duration"),
                            durationFor(type),
                        ),
                        delay: num(group.getAttribute("data-ds-delay"), 0),
                        each: num(
                            group.getAttribute("data-ds-each"),
                            DEFAULT_EACH,
                        ),
                    };
                addTrigger(group, function () {
                    group.classList.add("ds-revealed");
                    reveal(items, type, options);
                });
            },
        );
    }

    // ---------- Parallax (tablet and desktop only) ----------

    function createParallax() {
        toArray(document.querySelectorAll("[data-ds-parallax]")).forEach(
            function (el) {
                if (isThemeOwned(el)) {
                    el.removeAttribute("data-ds-parallax");
                    warnSkip(el);
                    return;
                }
                var strength = Math.min(
                        Math.max(
                            num(el.getAttribute("data-ds-parallax"), 0.12),
                            0.05,
                        ),
                        0.2,
                    ),
                    shift = strength * 50, // yPercent travel each way
                    overscan = 1 + (shift * 2.4) / 100, // always covers the travel
                    host = el.parentElement;
                var tween = gsap.fromTo(
                    el,
                    { yPercent: -shift, scale: overscan },
                    {
                        yPercent: shift,
                        scale: overscan,
                        ease: "none",
                        scrollTrigger: {
                            trigger: host,
                            start: "top bottom",
                            end: "bottom top",
                            scrub: true,
                        },
                    },
                );
                state.parallax.push(tween);
                state.created++;
            },
        );
    }

    function killParallax() {
        state.parallax.forEach(function (tween) {
            if (tween.scrollTrigger) tween.scrollTrigger.kill();
            tween.kill();
            gsap.set(tween.targets(), { clearProps: "transform" });
        });
        state.parallax = [];
    }

    function syncParallax() {
        var wanted = !prefersReducedMotion();
        if (wanted && !state.parallax.length) {
            createParallax();
            ScrollTrigger.refresh();
        } else if (!wanted && state.parallax.length) {
            killParallax();
        }
    }

    // ---------- Safety nets ----------

    // Anything whose trigger can never be reached (for example a block right
    // above a short footer) is revealed instead of staying hidden.
    function revealUnreachable() {
        var max = ScrollTrigger.maxScroll(window);
        state.triggers.forEach(function (record) {
            if (!record.done && record.st && record.st.start > max) {
                record.fire();
                record.st.kill();
            }
        });
    }

    function showEverything() {
        killParallax();
        state.triggers.forEach(function (record) {
            if (record.st) record.st.kill();
        });
        state.triggers = [];
        toArray(
            document.querySelectorAll(
                "[data-ds-anim], [data-ds-stagger] .ds-item, [data-ds-parallax]",
            ),
        ).forEach(function (el) {
            gsap.killTweensOf(el);
            gsap.set(el, { clearProps: "transform,opacity,clipPath" });
        });
        root.classList.add("ds-reduced-motion");
        root.classList.remove("ds-ready");
    }

    // One refresh after content that changes height (FAQ answers, the
    // "view all" news button). Debounced; never re-triggers itself.
    function scheduleRefresh() {
        window.clearTimeout(state.refreshTimer);
        state.refreshTimer = window.setTimeout(function () {
            ScrollTrigger.refresh();
        }, 500);
    }

    function watchLayoutChanges() {
        document.addEventListener("click", function (e) {
            var t = e.target;
            if (
                t &&
                t.closest &&
                t.closest(".sk__faq-toggle, #vg-view-all-news")
            ) {
                scheduleRefresh();
            }
        });
        // FAQ answers animate max-height; measure again once they settle.
        document.addEventListener("transitionend", function (e) {
            var t = e.target;
            if (
                e.propertyName === "max-height" &&
                t &&
                t.classList &&
                t.classList.contains("sk__faq-answer")
            ) {
                scheduleRefresh();
            }
        });
    }

    // ---------- Mouse-parallax rectangles (opt-in: data-ds-layers) ----------
    // theme.js starts Parallax.js only for .sk__rectangles-left-parallax-layers
    // and a few fixed ids, so full-left rectangle sets with other ids (for
    // example "Our Story") stay still. This starts them the same way the
    // theme starts #sk__parallax-layers-featured-project: desktop with a
    // mouse only, like the theme.
    var THEME_LAYER_IDS = [
        "sk__parallax-layers-1",
        "sk__parallax-layers-featured-project",
        "sk__parallax-layers-laptop",
        "sk__parallax-layers-text-right",
    ];

    function setupLayers() {
        if (typeof window.Parallax !== "function") return;
        var finePointer =
            window.matchMedia &&
            window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        if (!finePointer) return;
        toArray(document.querySelectorAll("[data-ds-layers]")).forEach(
            function (el) {
                if (
                    el.classList.contains(
                        "sk__rectangles-left-parallax-layers",
                    ) ||
                    THEME_LAYER_IDS.indexOf(el.id) !== -1
                ) {
                    return; // theme.js already runs this one
                }
                new window.Parallax(el);
            },
        );
    }

    // ---------- Smooth wheel scrolling (Lenis-style) ----------
    // theme.js creates ScrollSmoother with smooth: 0, i.e. no smoothing.
    // Turning smoothing on in that same smoother (instead of adding Lenis)
    // keeps one scroll engine, so every theme ScrollTrigger, anchor link and
    // the menu's scroll lock keep working. 1s of catch-up is close to
    // Lenis' default feel (lerp 0.1). Touch-only devices keep native
    // scrolling, as Lenis does by default.
    var SMOOTH_SCROLL_SECONDS = 1;

    function setupSmoothScroll() {
        var smoother =
            window.ScrollSmoother && window.ScrollSmoother.get
                ? window.ScrollSmoother.get()
                : null;
        if (!smoother || typeof smoother.smooth !== "function") return;
        if (window.ScrollTrigger && window.ScrollTrigger.isTouch === 1) return;
        if (isTouchDevice) return; // phones/tablets keep native scrolling
        if (smoother.smooth() > 0) return; // already smoothing
        smoother.smooth(SMOOTH_SCROLL_SECONDS);
        // Created with smooth: 0, ScrollSmoother left #smooth-wrapper in its
        // native-scroll layout (position: relative). Re-applying the wrapper
        // switches it to the fixed layout that smoothing needs.
        smoother.wrapper(smoother.wrapper());
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }

    // ---------- Touch devices: the desktop effects, adapted ----------
    // Phones and tablets have no mouse, so hover states and the mouse-driven
    // rectangle parallax never show there. These give touch screens the
    // same effects: hover looks while a card is in view (or a link/button is
    // pressed), rectangles that drift with scrolling, and counters that run
    // once they are actually visible.

    var isTouchDevice = (function () {
        var noHover =
            window.matchMedia && window.matchMedia("(hover: none)").matches;
        return !!(
            noHover ||
            (window.ScrollTrigger && window.ScrollTrigger.isTouch === 1)
        );
    })();

    // Elements that show their hover look while in the middle of the screen
    var TOUCH_CARDS = [
        ".sk__portfolio-item",
        "a.sk__portfolio-thumblink",
        ".vg-office-card",
        ".post-image",
        "[data-ds-hover]",
    ].join(",");

    // Home (our-portfolio / our-portfolio1) and portfolio page
    // (our-portfolio / our-portfolio2) card grids: no in-view hover look
    var NO_TOUCH_CARD_SECTIONS = "#our-portfolio, #our-portfolio1, #our-portfolio2";

    // Theme stylesheets whose :hover rules are mirrored as .ds-hover rules
    var HOVER_SHEETS = /\/shared\/css\/(theme|theme-colors|custom|responsive-fix)\.css/;

    function mirrorHoverRules() {
        var out = [];
        function walk(rules, wrapOpen, wrapClose) {
            toArray(rules).forEach(function (rule) {
                if (rule.type === 4 && rule.media) {
                    // @media: keep the same condition around the copies
                    walk(
                        rule.cssRules,
                        wrapOpen + "@media " + rule.media.mediaText + "{",
                        "}" + wrapClose,
                    );
                } else if (
                    rule.selectorText &&
                    rule.selectorText.indexOf(":hover") !== -1
                ) {
                    var selector = rule.selectorText.replace(
                        /:hover/g,
                        ".ds-hover",
                    );
                    out.push(
                        wrapOpen +
                            selector +
                            "{" +
                            rule.style.cssText +
                            "}" +
                            wrapClose,
                    );
                }
            });
        }
        toArray(document.styleSheets).forEach(function (sheet) {
            if (!sheet.href || !HOVER_SHEETS.test(sheet.href)) return;
            try {
                walk(sheet.cssRules, "", "");
            } catch (err) {
                /* unreadable sheet: skip */
            }
        });
        var style = document.createElement("style");
        style.id = "ds-touch-hover";
        document.head.appendChild(style);
        out.forEach(function (text) {
            try {
                style.sheet.insertRule(text, style.sheet.cssRules.length);
            } catch (err) {
                /* a selector the browser rejects: skip that one */
            }
        });
        return style.sheet.cssRules.length;
    }

    function setupTouchHover() {
        if (!isTouchDevice) return;
        root.classList.add("ds-touch");
        state.hoverRules = mirrorHoverRules();

        // Cards: hover look while the card is in the middle band of the screen
        if (window.ScrollTrigger) {
            toArray(document.querySelectorAll(TOUCH_CARDS)).forEach(
                function (card) {
                    // Not in the portfolio card grids of the home and
                    // portfolio pages (kept as they are on touch screens).
                    if (card.closest(NO_TOUCH_CARD_SECTIONS)) return;
                    ScrollTrigger.create({
                        trigger: card,
                        start: "top 70%",
                        end: "bottom 30%",
                        toggleClass: { targets: card, className: "ds-hover" },
                    });
                },
            );
        }

        // Buttons and links: hover look while pressed, fading after release
        var pressed = null,
            releaseTimer = 0;
        document.addEventListener(
            "touchstart",
            function (e) {
                var el = e.target.closest && e.target.closest("a, button, .btn");
                if (!el || el.closest(NO_TOUCH_CARD_SECTIONS)) return;
                window.clearTimeout(releaseTimer);
                if (pressed && pressed !== el) pressed.classList.remove("ds-hover");
                pressed = el;
                el.classList.add("ds-hover");
            },
            { passive: true },
        );
        function release() {
            if (!pressed) return;
            var el = pressed;
            releaseTimer = window.setTimeout(function () {
                el.classList.remove("ds-hover");
                if (pressed === el) pressed = null;
            }, 450);
        }
        document.addEventListener("touchend", release, { passive: true });
        document.addEventListener("touchcancel", release, { passive: true });
    }

    // Rectangles: on touch screens the depth layers drift with scrolling
    // (deeper layers move further), echoing the desktop mouse parallax.
    function setupTouchLayers() {
        // Like the desktop rectangles (started by theme.js), this ignores the
        // reduced-motion setting, so phones and desktops match.
        if (!isTouchDevice || !window.ScrollTrigger) return;
        toArray(
            document.querySelectorAll(
                ".sk__rectangles-left-parallax-layers, .sk__rectangles-full-left-parallax-layers",
            ),
        ).forEach(function (scene) {
            // Skip scenes theme.js already runs with Parallax.js (e.g. iPads,
            // which report a desktop user agent); two drivers would fight.
            var first = scene.querySelector(":scope > [data-depth]");
            if (first && first.style.transformStyle === "preserve-3d") return;
            toArray(scene.querySelectorAll(":scope > [data-depth]")).forEach(
                function (layer) {
                    var depth = num(layer.getAttribute("data-depth"), 1),
                        travel = depth * 18;
                    gsap.fromTo(
                        layer,
                        { y: travel },
                        {
                            y: -travel,
                            ease: "none",
                            scrollTrigger: {
                                trigger: scene,
                                start: "top bottom",
                                end: "bottom top",
                                scrub: true,
                            },
                        },
                    );
                },
            );
        });
    }

    // Counters: theme.js counts as soon as a counter touches the bottom of
    // the screen, which on phones happens during the intro curtain, so the
    // count is never seen. This restarts it from 0 each time the counter
    // scrolls into view, after the curtain has gone.
    function setupCounters() {
        if (!window.ScrollTrigger) return;
        toArray(document.querySelectorAll(".sk__counter")).forEach(function (el) {
            var target = parseFloat(
                (el.getAttribute("data-gsap-counter-number") || "").replace(
                    /[^\d.-]/g,
                    "",
                ),
            );
            if (isNaN(target)) return;
            var decimals = ((String(target).split(".")[1] || "")).length;
            // Hand the counter over: stop the theme's tween and trigger
            ScrollTrigger.getAll().forEach(function (st) {
                if (st.trigger === el) {
                    if (st.animation) st.animation.kill();
                    st.kill();
                }
            });
            var proxy = { val: 0 },
                tween = null;
            function paint() {
                el.innerText = proxy.val.toLocaleString("en-US", {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                });
            }
            function run() {
                if (document.querySelector(".sk__master-curtain")) {
                    window.setTimeout(run, 150); // wait for the intro curtain
                    return;
                }
                if (tween) tween.kill();
                proxy.val = 0;
                paint();
                tween = gsap.to(proxy, {
                    val: target,
                    duration: prefersReducedMotion() ? 1 : 2,
                    ease: "power1.out",
                    onUpdate: paint,
                });
            }
            ScrollTrigger.create({
                trigger: el,
                start: "top 90%",
                onEnter: run,
            });
        });
    }

    // ---------- Init ----------

    function init() {
        if (state.initialized) return;
        state.initialized = true;
        api.initialized = true;

        // Runs before the reduced-motion check on purpose: it matches the
        // theme's own rectangle sets ("Who We Are", "What Drives Us"), which
        // theme.js starts regardless of that setting.
        try {
            setupLayers();
        } catch (err) {
            if (window.console && console.error) {
                console.error("[DarkStar Effects] layers disabled:", err);
            }
        }

        // Also before the reduced-motion check: bbrpl.com's Lenis smooths
        // the wheel regardless of that setting, and this matches it.
        try {
            setupSmoothScroll();
        } catch (err) {
            if (window.console && console.error) {
                console.error("[DarkStar Effects] smooth scroll disabled:", err);
            }
        }

        if (
            typeof window.gsap === "undefined" ||
            typeof window.ScrollTrigger === "undefined"
        ) {
            return; // nothing hidden yet, so the page simply stays static
        }

        // Under reduced motion the reveals still run, as opacity-only fades
        // (see fromVars). Parallax stays off (syncParallax checks it).

        // theme.js registers ScrollTrigger already; register only if it
        // has not (e.g. a page that ships GSAP without theme.js).
        if (!window.ScrollTrigger.getAll().length) {
            gsap.registerPlugin(window.ScrollTrigger);
        }

        try {
            root.classList.add("ds-ready");
            setupSingles();
            setupStaggers();
            syncParallax();
        } catch (err) {
            showEverything();
            if (window.console && console.error) {
                console.error(
                    "[DarkStar Effects] disabled after an error:",
                    err,
                );
            }
            return;
        }

        [setupCounters, setupTouchHover, setupTouchLayers].forEach(function (fn) {
            try {
                fn();
            } catch (err) {
                if (window.console && console.error) {
                    console.error("[DarkStar Effects] " + fn.name + " disabled:", err);
                }
            }
        });

        watchLayoutChanges();
        ScrollTrigger.addEventListener("refresh", revealUnreachable);
        window.addEventListener("load", revealUnreachable);

        if (parallaxQuery && parallaxQuery.addEventListener) {
            parallaxQuery.addEventListener("change", syncParallax);
        }
        if (reduceQuery && reduceQuery.addEventListener) {
            reduceQuery.addEventListener("change", function () {
                if (prefersReducedMotion()) showEverything();
            });
        }
    }

    var api = {
        version: "1.0.0",
        initialized: false,
        // Existing smoother, for anything that needs it. Never created here.
        smoother: function () {
            return window.ScrollSmoother && window.ScrollSmoother.get
                ? window.ScrollSmoother.get()
                : null;
        },
        // ScrollTriggers this layer has created (reveal triggers are
        // once-only and remove themselves after firing).
        triggerCount: function () {
            return state.created;
        },
        refresh: function () {
            if (window.ScrollTrigger) ScrollTrigger.refresh();
        },
    };
    window.VGDarkstarEffects = api;

    // theme.js runs inside jQuery's ready callback, which jQuery 3 fires
    // asynchronously just after DOMContentLoaded. Deferring one tick lets
    // theme.js finish (smoother created, its triggers registered) first.
    function start() {
        window.setTimeout(init, 0);
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})(window, document);
