/* Strips the thousands separator from counters tagged data-counter-plain.
   theme.js formats every .sk__counter with toLocaleString("en-US"), which
   turns 2026 into "2,026". Load this AFTER theme.js. */
(function (window, document) {
    "use strict";

    function strip(node) {
        var txt = node.textContent;
        if (txt.indexOf(",") === -1) return;
        node.textContent = txt.replace(/,/g, "");
    }

    function bind() {
        var nodes = document.querySelectorAll(".sk__counter[data-counter-plain]");
        if (!nodes.length) return;

        Array.prototype.forEach.call(nodes, function (node) {
            strip(node);
            if (typeof window.MutationObserver !== "function") return;

            new window.MutationObserver(function () {
                strip(node);
            }).observe(node, {
                childList: true,
                characterData: true,
                subtree: true
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bind);
    } else {
        bind();
    }
})(window, document);
