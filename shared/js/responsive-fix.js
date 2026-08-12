/* ---------------------------------------------------------------------------
   responsive-fix.js

   ScrollTrigger already auto-refreshes on DOMContentLoaded, load, resize and
   visibilitychange (see ScrollTrigger.config autoRefreshEvents). So this file
   deliberately does NOT hook those — duplicating them caused a feedback loop
   that force-closed the offcanvas nav and made scrolling jump.

   The only genuinely missing refreshes are the two GSAP cannot know about:

     1. after web fonts swap in — text height changes, so section heights and
        every cached trigger position change with it;
     2. after theme.js's 2.4s master-curtain intro finishes and detaches,
        which removes an element and shifts the layout.

   Nothing here dispatches synthetic events. Nothing runs while the offcanvas
   nav is open. Nothing touches opacity, transforms or any GSAP tween.

   Load AFTER assets/js/theme.js.
   --------------------------------------------------------------------------- */
(function () {
    "use strict";

    if (typeof ScrollTrigger === "undefined") return;

    var busy = false;
    var pending = false;

    function navIsOpen() {
        var c = document.body ? document.body.className : "";
        return (
            c.indexOf("hc-nav-open") !== -1 || c.indexOf("sk__nav-open") !== -1
        );
    }

    function refresh() {
        if (busy) return;

        /* Refreshing mid-transition fights the nav's own animation, so wait. */
        if (navIsOpen()) {
            if (!pending) {
                pending = true;
                window.setTimeout(function () {
                    pending = false;
                    refresh();
                }, 600);
            }
            return;
        }

        busy = true;
        try {
            ScrollTrigger.refresh();
        } catch (e) {
            /* never let a measurement pass break the page */
        }
        window.setTimeout(function () {
            busy = false;
        }, 300);
    }

    /* 1. Web fonts finished swapping. */
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            window.setTimeout(refresh, 60);
        });
    }

    /* 2. Master curtain intro is done and detached (delay 2.4s + duration +
          stagger, per theme.js). One pass, well clear of the animation. */
    window.addEventListener("load", function () {
        window.setTimeout(refresh, 3600);
    });
})();
