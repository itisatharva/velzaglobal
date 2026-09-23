(document.addEventListener("DOMContentLoaded", function () {
    const viewAllBtn = document.getElementById("vg-view-all-news");
    viewAllBtn &&
        viewAllBtn.addEventListener("click", function (e) {
            (e.preventDefault(),
                document
                    .querySelectorAll(
                        ".sk__blog-article-wrapper.sk__hidden-article",
                    )
                    .forEach((article) => {
                        article.classList.remove("sk__hidden-article");
                    }),
                (viewAllBtn.style.display = "none"));
        });
}),
    document.addEventListener("DOMContentLoaded", function () {
        var trigger = document.getElementById("sk__country-switcher-trigger"),
            menu = document.getElementById("sk__country-switcher-menu");
        if (!trigger || !menu) return;
        function closeMenu() {
            (menu.classList.remove("sk__open"),
                trigger.classList.remove("sk__active"),
                trigger.setAttribute("aria-expanded", "false"));
        }
        (trigger.addEventListener("click", function (e) {
            e.stopPropagation();
            var isOpen = menu.classList.toggle("sk__open");
            (trigger.classList.toggle("sk__active", isOpen),
                trigger.setAttribute(
                    "aria-expanded",
                    isOpen ? "true" : "false",
                ));
        }),
            document.addEventListener("click", function (e) {
                !menu.contains(e.target) && e.target !== trigger && closeMenu();
            }),
            document.addEventListener("keydown", function (e) {
                e.key === "Escape" && closeMenu();
            }));
    }),
    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll(".sk__faq-accordion").forEach(function (accordion) {
            var items = accordion.querySelectorAll(".sk__faq-item");
            items.forEach(function (item) {
                var toggle = item.querySelector(".sk__faq-toggle");
                var answer = item.querySelector(".sk__faq-answer");
                if (!toggle || !answer) return;
                if (item.classList.contains("is-open")) {
                    toggle.setAttribute("aria-expanded", "true");
                    answer.style.maxHeight = answer.scrollHeight + "px";
                }
                toggle.addEventListener("click", function () {
                    var isOpen = item.classList.contains("is-open");
                    items.forEach(function (other) {
                        other.classList.remove("is-open");
                        other.querySelector(".sk__faq-toggle").setAttribute("aria-expanded", "false");
                        other.querySelector(".sk__faq-answer").style.maxHeight = null;
                    });
                    if (!isOpen) {
                        item.classList.add("is-open");
                        toggle.setAttribute("aria-expanded", "true");
                        answer.style.maxHeight = answer.scrollHeight + "px";
                    }
                });
            });
        });
    }));
