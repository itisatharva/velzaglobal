document.addEventListener("DOMContentLoaded", function () {
    const viewAllBtn = document.getElementById("vg-view-all-news");
    if (viewAllBtn) {
        viewAllBtn.addEventListener("click", function (e) {
            e.preventDefault();
            document
                .querySelectorAll(
                    ".sk__blog-article-wrapper.sk__hidden-article",
                )
                .forEach((article) => {
                    article.classList.remove("sk__hidden-article");
                });
            viewAllBtn.style.display = "none"; // remove this line if you want the button to stay visible after clicking
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    var trigger = document.getElementById("sk__country-switcher-trigger");
    var menu = document.getElementById("sk__country-switcher-menu");
    if (!trigger || !menu) return;

    function closeMenu() {
        menu.classList.remove("sk__open");
        trigger.classList.remove("sk__active");
        trigger.setAttribute("aria-expanded", "false");
    }

    trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        var isOpen = menu.classList.toggle("sk__open");
        trigger.classList.toggle("sk__active", isOpen);
        trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", function (e) {
        if (!menu.contains(e.target) && e.target !== trigger) closeMenu();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeMenu();
    });
});
