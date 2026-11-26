/**
 * Footer newsletter form guard.
 *
 * The footer "subscribe" forms (form.sk__subscribe-form) have no backend endpoint yet: they have no `action`
 * and shared/js/form.js is not loaded, so a native submit sent the address as `?the_email=…` in the page URL,
 * where it reaches server logs and analytics (page_location). Until a real subscription endpoint exists
 * (backend-owned), submission is stopped here and an inline status message is shown. Nothing is sent or stored.
 *
 * To wire a real endpoint later: remove this script tag and connect the form to the approved backend.
 */
(function (document) {
    "use strict";

    var MESSAGE = "Newsletter sign-up is opening soon. Your email address has not been sent or stored.";

    function statusFor(form) {
        var node = form.querySelector(".vg-subscribe-status");
        if (!node) {
            node = document.createElement("p");
            node.className = "vg-subscribe-status";
            node.setAttribute("role", "status");
            form.appendChild(node);
        }
        return node;
    }

    // Capture phase on document: runs for every subscribe form, including any added later.
    document.addEventListener("submit", function (e) {
        var form = e.target;
        if (!form || !form.classList || !form.classList.contains("sk__subscribe-form")) return;
        if (form.getAttribute("action")) return; // a form wired to a real endpoint is left alone
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        if (input) input.value = "";
        statusFor(form).textContent = MESSAGE;
    }, true);
})(document);
