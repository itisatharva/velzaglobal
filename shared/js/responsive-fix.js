(function () {
    "use strict";
    if (typeof ScrollTrigger > "u") return;
    var busy = !1,
        pending = !1;
    function navIsOpen() {
        var c = document.body ? document.body.className : "";
        return (
            c.indexOf("hc-nav-open") !== -1 || c.indexOf("sk__nav-open") !== -1
        );
    }
    function refresh() {
        if (!busy) {
            if (navIsOpen()) {
                pending ||
                    ((pending = !0),
                    window.setTimeout(function () {
                        ((pending = !1), refresh());
                    }, 600));
                return;
            }
            busy = !0;
            try {
                ScrollTrigger.refresh();
            } catch {}
            window.setTimeout(function () {
                busy = !1;
            }, 300);
        }
    }
    (document.fonts &&
        document.fonts.ready &&
        document.fonts.ready.then(function () {
            window.setTimeout(refresh, 60);
        }),
        window.addEventListener("load", function () {
            window.setTimeout(refresh, 3600);
        }));
})();
