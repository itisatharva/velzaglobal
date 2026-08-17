(function (window2, document2) {
    "use strict";
    function strip(node) {
        var txt = node.textContent;
        txt.indexOf(",") !== -1 && (node.textContent = txt.replace(/,/g, ""));
    }
    function bind() {
        var nodes = document2.querySelectorAll(
            ".sk__counter[data-counter-plain]",
        );
        nodes.length &&
            Array.prototype.forEach.call(nodes, function (node) {
                (strip(node),
                    typeof window2.MutationObserver == "function" &&
                        new window2.MutationObserver(function () {
                            strip(node);
                        }).observe(node, {
                            childList: !0,
                            characterData: !0,
                            subtree: !0,
                        }));
            });
    }
    document2.readyState === "loading"
        ? document2.addEventListener("DOMContentLoaded", bind)
        : bind();
})(window, document);
