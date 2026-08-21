$(document).ready(function () {
    function isItMobileDevice() {
        var isMobile2 = !1;
        return (
            (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
                navigator.userAgent,
            ) ||
                /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                    navigator.userAgent.substr(0, 4),
                )) &&
                (isMobile2 = !0),
            isMobile2
        );
    }
    var isMobile = isItMobileDevice(),
        screenRatio = window.innerWidth / window.innerHeight;
    function getScreenRatio() {
        let w = window.innerWidth,
            h = window.innerHeight;
        return w / h;
    }
    function dispatchResizeExceptOn($bodyClass) {
        let targetClass = $bodyClass;
        document.querySelector("body").classList.contains(targetClass) ||
            ($("body").addClass("nav-ignore-close"),
            window.dispatchEvent(new Event("resize")),
            $("body").removeClass("nav-ignore-close"));
    }
    const vw = (coef) => window.innerWidth * (coef / 100),
        vh = (coef) => window.innerHeight * (coef / 100);
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
    let smoother = ScrollSmoother.create({ smooth: 0, effects: !0 });
    (smoother.effects(".sk__parallax-container > img", { speed: "auto" }),
        smoother.effects(".sk__parallax-container > video", { speed: "auto" }));
    let masterCurtain = $(".sk__master-curtain"),
        effectsMasterDelay = parseFloat(0);
    if (masterCurtain.length) {
        $(".sk__master-curtain .mcurtain").addClass("mcurtain-visible");
        let masterCurtainDelay = 2.4,
            masterCurtainDuration = 0.4,
            masterCurtainStagger = 0.24;
        ((effectsMasterDelay =
            masterCurtainDelay +
            masterCurtainDuration +
            masterCurtainStagger * 2),
            (effectsMasterDelay = parseFloat(effectsMasterDelay)),
            gsap.to(".mcurtain", {
                yPercent: -100,
                duration: masterCurtainDuration,
                delay: masterCurtainDelay - 0.7,
                stagger: masterCurtainStagger,
                ease: "power2.in",
            }),
            setTimeout(
                function () {
                    $(".sk__master-curtain").detach();
                },
                (effectsMasterDelay + 0.7) * 1e3,
            ));
    }
    var MenuCSSselector = "#main-nav";
    (setTimeout(function () {
        $(MenuCSSselector).css("opacity", "1");
    }, 1e3),
        $(window).scroll(function () {
            var scroll = $(window).scrollTop();
            scroll >= 100
                ? $("body").addClass("sk__scrolling-started")
                : $("body").removeClass("sk__scrolling-started");
        }),
        $(".navbar-nav > li > ul li.menu-item-has-children").on(
            "click",
            function (e) {
                e.target === this &&
                    (event.preventDefault(),
                    $(this).siblings().removeClass("sk__expand-children"),
                    $(this).toggleClass("sk__expand-children"));
            },
        ),
        $(".navbar-nav > li > ul li.menu-item-has-children > a").on(
            "click",
            function () {
                (event.preventDefault(),
                    $(this)
                        .parent()
                        .siblings()
                        .removeClass("sk__expand-children"),
                    $(this).parent().toggleClass("sk__expand-children"));
            },
        ),
        $(MenuCSSselector).hcOffcanvasNav({
            disableAt: 9999,
            width: 290,
            disableBody: !1,
            insertClose: !1,
            insertBack: !0,
            labelBack: "Back",
            levelTitleAsBack: !1,
            pushContent: !0,
            pushContent: ".pushable-content",
            position: "right",
            swipeGestures: !0,
            levelSpacing: 7,
        }));
    var $nav = $(MenuCSSselector).hcOffcanvasNav(),
        Nav = $nav.data("hcOffcanvasNav");
    ($(window).on("resize", function () {
        $(MenuCSSselector).length &&
            $(window).width() > 576 &&
            Nav.isOpen() &&
            ($("body").hasClass("nav-ignore-close") || Nav.close(!0));
    }),
        $(".hc-nav-trigger").on("click", function (event2) {
            $("body").toggleClass("sk__nav-open");
        }));
    var $offcanvasNavEl = $(".hc-offcanvas-nav");
    if ($offcanvasNavEl.length) {
        var navScrollLockObserver = new MutationObserver(function () {
            smoother.paused($offcanvasNavEl.hasClass("nav-open"));
        });
        navScrollLockObserver.observe($offcanvasNavEl.get(0), {
            attributes: !0,
            attributeFilter: ["class"],
        });
    }
    ($(".menu-trigger").on("click", function (event2) {
        (event2.preventDefault(),
            $("#smooth-wrapper").toggleClass("main-menu-open"));
    }),
        $(".sk__submenu-ul").wrapInner('<span class="nav-subwrap"></span>'));
    var heroSliderSlidingAnimationTime = 6.5,
        heroSliderExists = $("#sk__hero-carousel-slider .carousel-item").length;
    if (heroSliderExists) {
        var numberOfHeroSlides = $(
                "#sk__hero-carousel-slider .carousel-item",
            ).length,
            heroSliderTransitionTime = 1.9,
            heroSliderTotalTime = 26.4;
        ((heroSliderTotalTime =
            numberOfHeroSlides *
            (heroSliderSlidingAnimationTime + heroSliderTransitionTime)),
            $(
                "#sk__hero-carousel-slider:not(.sk__static-carousel-slider)",
            ).carousel({
                ride: "carousel",
                pause: !1,
                interval: heroSliderSlidingAnimationTime * 1e3,
            }),
            $("#sk__hero-carousel-slider.sk__static-carousel-slider").carousel({
                ride: !1,
                touch: !1,
                interval: !1,
            }));
    }
    function fadeInBasic() {
        let expression = "sk__fade-in-",
            elements = $("[class*=" + expression + "]"),
            max = 100,
            n = 1;
        for (; n < max + 1; ) {
            let theDelay = n / 10,
                elements2 = "." + expression + n;
            ($(elements2).each(function (i) {
                $(this).attr("data-sk-fade-match", i + 1);
                let finalTarget = $(
                        "." +
                            expression +
                            n +
                            '[data-sk-fade-match="' +
                            (i + 1) +
                            '"]',
                    ),
                    theDuration = 1;
                (finalTarget
                    .attr("class")
                    .split(" ")
                    .forEach(function (item, index) {
                        if (item.includes("duration-")) {
                            let extractDuration = item.replace("duration-", "");
                            ((extractDuration = parseInt(extractDuration)),
                                (theDuration = extractDuration / 10));
                        }
                    }),
                    finalTarget.length &&
                        gsap.to(finalTarget, {
                            opacity: 1,
                            ease: "power1.inOut",
                            scrollTrigger: {
                                trigger: finalTarget,
                                start: "top 90%",
                                end: "top top-=200px",
                                toggleActions: "play complete",
                                scrub: !1,
                            },
                            duration: theDuration,
                            delay: theDelay,
                        }));
            }),
                n++);
        }
    }
    fadeInBasic();
    function revealText($element, $duration, $delay, $stagger, $fromDirection) {
        let elementSelector = $element;
        $(elementSelector).each(function (i) {
            let element = $(this);
            if (element.length) {
                let ifUpdate2 = function ($newElement, $oldElement) {
                    let newElement = $newElement,
                        oldElement = $oldElement;
                    return (
                        (newElement === 0 || newElement) &&
                            (oldElement = newElement),
                        oldElement
                    );
                };
                var ifUpdate = ifUpdate2;
                let newDuration = $duration,
                    newDelay = $delay,
                    newStagger = $stagger,
                    newDirection = $fromDirection,
                    theDuration = ifUpdate2(newDuration, 0.4),
                    theDelay = ifUpdate2(newDelay, 0),
                    theStagger = ifUpdate2(newStagger, 0.3),
                    theDirection = ifUpdate2(newDirection, "default"),
                    xFrom = 0,
                    yFrom = 120;
                (theDirection == "left"
                    ? ((xFrom = -20), (yFrom = 0))
                    : theDirection == "right"
                      ? ((xFrom = 20), (yFrom = 0))
                      : theDirection == "top" && ((xFrom = 0), (yFrom = -120)),
                    gsap.timeline().fromTo(
                        element,
                        { opacity: 0, xPercent: xFrom, yPercent: yFrom },
                        {
                            opacity: 1,
                            xPercent: 0,
                            yPercent: 0,
                            duration: theDuration,
                            stagger: theStagger,
                            delay: theDelay,
                        },
                    ));
            }
        });
    }
    function scrollRevealText(
        $element,
        $duration,
        $delay,
        $stagger,
        $fromDirection,
        $scrub,
        $startString,
        $endString,
        $toggleActions,
    ) {
        let elementSelector = $element;
        $(elementSelector).each(function (i) {
            let element = $(this);
            if (element.length) {
                let ifUpdate2 = function ($newElement, $oldElement) {
                        let newElement = $newElement,
                            oldElement = $oldElement;
                        return (
                            newElement &&
                                (newElement === 0 || newElement) &&
                                (oldElement = newElement),
                            oldElement
                        );
                    },
                    ifScrub2 = function ($newScrub) {
                        $scrub === !1 && (theScrub = !1);
                    };
                var ifUpdate = ifUpdate2,
                    ifScrub = ifScrub2;
                let newDuration = $duration,
                    newDelay = $delay,
                    newStagger = $stagger,
                    newDirection = $fromDirection,
                    newScrub = $scrub,
                    newStartString = $startString,
                    newEndString = $endString,
                    newActions = $toggleActions,
                    theScrub = !0;
                theScrub = ifScrub2(newScrub);
                let theDuration = ifUpdate2(newDuration, 0.7),
                    theDelay = ifUpdate2(newDelay, 0),
                    theStagger = ifUpdate2(newStagger, 0.3),
                    theDirection = ifUpdate2(newDirection, "default"),
                    theStartString = ifUpdate2(newStartString, "top 80%"),
                    theEndString = ifUpdate2(newEndString, "top 30%"),
                    theActions = ifUpdate2(
                        newActions,
                        "play complete reverse pause",
                    ),
                    xFrom = 0,
                    yFrom = 120;
                theDirection == "left"
                    ? ((xFrom = -20), (yFrom = 0))
                    : theDirection == "right"
                      ? ((xFrom = 20), (yFrom = 0))
                      : theDirection == "top" && ((xFrom = 0), (yFrom = -120));
                let finalSelector = elementSelector + "-" + i;
                gsap.fromTo(
                    element,
                    { opacity: 0, xPercent: xFrom, yPercent: yFrom },
                    {
                        opacity: 1,
                        xPercent: 0,
                        yPercent: 0,
                        ease: "power1.out",
                        scrollTrigger: {
                            trigger: element,
                            start: theStartString,
                            end: theEndString,
                            toggleActions: theActions,
                            scrub: theScrub,
                        },
                        duration: theDuration,
                        stagger: theStagger,
                        delay: theDelay,
                    },
                );
            }
        });
    }
    function massFadeIn(
        $triggerSelector,
        $targetToAnimateSelector,
        $staggerTime,
        $fromString,
        $delay,
        $presetType,
    ) {
        let theTrigger = $triggerSelector,
            theTarget = $targetToAnimateSelector,
            newStagger = $staggerTime,
            newFromString = $fromString,
            newDelay = $delay,
            newType = $presetType;
        $(theTrigger).each(function (i) {
            if ($(this).length) {
                let ifUpdate2 = function ($newElement, $oldElement) {
                    let newElement = $newElement,
                        oldElement = $oldElement;
                    return (
                        newElement &&
                            (newElement === 0 || newElement) &&
                            (oldElement = newElement),
                        oldElement
                    );
                };
                var ifUpdate = ifUpdate2;
                let staggerTime = ifUpdate2(newStagger, 0.1),
                    fromString = ifUpdate2(newFromString, "[0,0]"),
                    theDelay = ifUpdate2(newDelay, 0.1),
                    theType = ifUpdate2(newType, 1),
                    finalTarget = $(theTarget);
                finalTarget.length &&
                    (theType == 1 &&
                        gsap.fromTo(
                            finalTarget,
                            { opacity: 0 },
                            {
                                opacity: 1,
                                delay: theDelay,
                                stagger: {
                                    each: staggerTime,
                                    from: fromString,
                                    grid: "auto",
                                },
                                scrollTrigger: {
                                    trigger: theTrigger,
                                    start: "top 70%",
                                    scrub: !1,
                                },
                            },
                        ),
                    theType == 2 &&
                        gsap.fromTo(
                            theTarget,
                            { x: -200, opacity: 0, scale: 0.8 },
                            {
                                x: 0,
                                opacity: 1,
                                scale: 1,
                                delay: theDelay,
                                stagger: staggerTime,
                                duration: 0.6,
                                scrollTrigger: {
                                    trigger: theTrigger,
                                    start: "top 80%",
                                    scrub: !1,
                                },
                            },
                        ));
            }
        });
    }
    function animatedHeadlines($targetSelector) {
        var duration = 2200;
        $($targetSelector).each(function () {
            let element = $(this),
                words = element
                    .find(".sk__visible")
                    .attr("data-sk-animated-words");
            if (words.length) {
                let switchVisibility2 = function ($word) {
                    let nextWord = $word.is(":last-child")
                        ? $word.parent().children().eq(0)
                        : $word.next();
                    ($word.removeClass("sk__visible").addClass("sk__hidden"),
                        nextWord
                            .removeClass("sk__hidden")
                            .addClass("sk__visible"));
                    let newWidth = parseInt(
                        element
                            .find(
                                ".sk__animated-headline-words span.lvl2.sk__visible",
                            )
                            .css("width"),
                    );
                    ((newWidth = newWidth + 30),
                        element.find(".sk__animated-headline-words").css({
                            width: newWidth,
                            marginLeft: "-18px",
                            paddingLeft: "15px",
                            marginRight: "-18px",
                            paddingRight: "15px",
                        }),
                        setTimeout(function () {
                            switchVisibility2(nextWord);
                        }, duration));
                };
                var switchVisibility = switchVisibility2;
                (words.split(",").forEach(function (item) {
                    element
                        .find(".sk__visible")
                        .parent()
                        .append(
                            '<span class="sk__clipped-text sk__gradient-back-v1">' +
                                item +
                                "</span>",
                        );
                }),
                    $($targetSelector + " > span").addClass("lvl1"),
                    $($targetSelector + " > span > span").addClass("lvl2"),
                    element
                        .find(
                            ".sk__animated-headline-words span.lvl2.sk__visible",
                        )
                        .wrap("<b></b>"));
                let initialWidth = parseInt(
                    element.find(".sk__animated-headline-words b").css("width"),
                );
                ((initialWidth = initialWidth + 16),
                    element
                        .find(
                            ".sk__animated-headline-words span.lvl2.sk__visible",
                        )
                        .unwrap(),
                    element
                        .find(".sk__animated-headline-words")
                        .css("width", initialWidth),
                    setTimeout(function () {
                        switchVisibility2(element.find(".sk__visible").eq(0));
                    }, duration + 1200));
            }
        });
    }
    (animatedHeadlines(".sk__animated-headline"),
        $("#sk__hero-carousel-slider .carousel-item.active").addClass(
            "first-load",
        ));
    function homeHeroSliderEntranceAnimations() {
        if (heroSliderExists) {
            let zoomingHero2 = function ($targetSelector) {
                if (!effectsMasterDelay2) var effectsMasterDelay2 = 0;
                let targetSelector = $targetSelector,
                    firstLoadSourceSelector =
                        "#sk__hero-carousel-slider .carousel-item.zooming.active.first-load ",
                    notFirstLoadSourceSelector =
                        "#sk__hero-carousel-slider .carousel-item.zooming.active:not(.first-load) ",
                    finalSelectorFirstLoad =
                        firstLoadSourceSelector + targetSelector,
                    finalSelectorNotFirstLoad =
                        notFirstLoadSourceSelector + targetSelector,
                    heroActiveSlideFirstLoad = $(finalSelectorFirstLoad);
                if (heroActiveSlideFirstLoad.length) {
                    let firstLoadSlideDelay = effectsMasterDelay2 - 1.2;
                    (firstLoadSlideDelay < 0 && (firstLoadSlideDelay = 0),
                        gsap.timeline().fromTo(
                            heroActiveSlideFirstLoad,
                            { transform: "matrix(1, 0, 0, 1, 0, 0)" },
                            {
                                transform: "matrix(1.1, 0, 0, 1.1, 0, 0)",
                                duration: heroSliderSlidingAnimationTime,
                                delay: firstLoadSlideDelay,
                            },
                        ));
                }
                let heroActiveSlideNotFirstLoad = $(finalSelectorNotFirstLoad);
                heroActiveSlideNotFirstLoad.length &&
                    gsap.timeline().fromTo(
                        heroActiveSlideNotFirstLoad,
                        { transform: "matrix(1, 0, 0, 1, 0, 0)" },
                        {
                            transform: "matrix(1.1, 0, 0, 1.1, 0, 0)",
                            duration: heroSliderSlidingAnimationTime,
                        },
                    );
            };
            var zoomingHero = zoomingHero2;
            let phaseOneDelay = effectsMasterDelay - 0.5;
            phaseOneDelay < 0 && (phaseOneDelay = 0);
            let phaseTwoDelay = effectsMasterDelay + 0.35,
                phaseOneDelayMilisec = phaseOneDelay * 1e3;
            (setTimeout(function () {
                $("#sk__hero-carousel-slider")
                    .find(".first-load")
                    .removeClass("first-load");
            }, phaseOneDelayMilisec),
                zoomingHero2(".sk__parallax-background-element"),
                zoomingHero2(".sk__morphing-hover-hero-container"));
            let n = 1,
                phase1FirstLoad = [],
                phase1Regular = [],
                phase2FirstLoad = [],
                phase2Regular = [];
            for (; n < numberOfHeroSlides + 1; )
                ((phase1FirstLoad[n] = $(
                    "#sk__hero-carousel-slider .hero-slide-" +
                        n +
                        ".carousel-item.active.first-load .animated-element.phase-1",
                )),
                    phase1FirstLoad[n].length &&
                        gsap.timeline().fromTo(
                            phase1FirstLoad[n],
                            { opacity: 0, yPercent: 120 },
                            {
                                opacity: 1,
                                yPercent: 0,
                                duration: 0.4,
                                stagger: 0.3,
                                delay: phaseOneDelay,
                            },
                        ),
                    (phase1Regular[n] = $(
                        "#sk__hero-carousel-slider .hero-slide-" +
                            n +
                            ".carousel-item.active:not(.first-load) .animated-element.phase-1",
                    )),
                    phase1Regular[n].length &&
                        gsap.timeline().fromTo(
                            phase1Regular[n],
                            { opacity: 0, yPercent: 120 },
                            {
                                opacity: 1,
                                yPercent: 0,
                                duration: 0.4,
                                stagger: 0.3,
                            },
                        ),
                    (phase2FirstLoad[n] = $(
                        "#sk__hero-carousel-slider .hero-slide-" +
                            n +
                            ".carousel-item.active.first-load .animated-element.phase-2",
                    )),
                    phase2FirstLoad[n].length &&
                        gsap.timeline().fromTo(
                            phase2FirstLoad[n],
                            { opacity: 0, xPercent: 20 },
                            {
                                opacity: 1,
                                xPercent: 0,
                                duration: 0.4,
                                stagger: {
                                    amount: 0.25,
                                    from: "end",
                                    grid: "auto",
                                },
                                delay: phaseTwoDelay,
                            },
                        ),
                    (phase2Regular[n] = $(
                        "#sk__hero-carousel-slider .hero-slide-" +
                            n +
                            ".carousel-item.active:not(.first-load) .animated-element.phase-2",
                    )),
                    phase2Regular[n].length &&
                        gsap.timeline().fromTo(
                            phase2Regular[n],
                            { opacity: 0, xPercent: 20 },
                            {
                                opacity: 1,
                                xPercent: 0,
                                duration: 0.4,
                                stagger: {
                                    amount: 0.25,
                                    from: "end",
                                    grid: "auto",
                                },
                                delay: 1.1,
                            },
                        ),
                    n++);
        }
    }
    homeHeroSliderEntranceAnimations();
    function homeHeroSliderExitAnimations() {
        if (heroSliderExists) {
            let zoomingHeroOut2 = function ($targetSelector) {
                if (!heroSliderTotalTime2) var heroSliderTotalTime2 = 20;
                let finalSelector =
                    "#sk__hero-carousel-slider .carousel-item.zooming.active " +
                    $targetSelector;
                $(finalSelector).each(function (i) {
                    let element = $(this);
                    if (element.length) {
                        let currentScale = $(element).css("transform");
                        gsap.timeline()
                            .fromTo(
                                element,
                                { transform: currentScale },
                                {
                                    transform:
                                        "matrix(1.00001, 0, 0, 1.00001, 0, 0)",
                                    duration: 0.4,
                                },
                            )
                            .to(element, {
                                transform:
                                    "matrix(1.00001, 0, 0, 1.00001, 0, 0)",
                                duration: heroSliderTotalTime2,
                            });
                    }
                });
            };
            var zoomingHeroOut = zoomingHeroOut2;
            (zoomingHeroOut2(".sk__parallax-background-element"),
                zoomingHeroOut2(".sk__morphing-hover-hero-container"));
            let n = 1,
                phase1 = [],
                phase2 = [];
            for (; n < numberOfHeroSlides + 1; )
                ((phase1[n] = $(
                    ".hero-slide-" + n + " .animated-element.phase-1",
                )),
                    phase1[n].length &&
                        gsap.timeline().to(
                            phase1[n],
                            {
                                opacity: 0,
                                yPercent: 120,
                                delay: 0.15,
                                duration: 0.5,
                            },
                            "<",
                        ),
                    (phase2[n] = $(
                        ".hero-slide-" + n + " .animated-element.phase-2",
                    )),
                    phase2[n].length &&
                        gsap.to(
                            phase2[n],
                            {
                                opacity: 0,
                                xPercent: 20,
                                delay: 0.15,
                                duration: 0.5,
                            },
                            "<",
                        ),
                    n++);
        }
    }
    function parallaxHeader() {
        $(".sk__parallax-header").each(function () {
            let parallaxHeaderParent = $(this),
                parallaxHeaderImage = $(this).find(
                    ".sk__parallax-header-image",
                );
            parallaxHeaderParent.length &&
                parallaxHeaderImage.length &&
                gsap.to(parallaxHeaderImage, {
                    top: 200,
                    scrollTrigger: {
                        trigger: parallaxHeaderParent,
                        start: "top top-=5px",
                        end: "bottom top-=200px",
                        scrub: !0,
                    },
                });
        });
    }
    function heroParallaxVaribleSpeeds($targetSelector) {
        let targetSelector = $targetSelector;
        $(targetSelector).each(function (i) {
            let element = $(this);
            if (element.length) {
                let parentEl = $(this).parent(),
                    speed = $(this).attr("data-sk-speed");
                if (element.length && parentEl.length && 1 <= speed <= 20) {
                    let n = 1;
                    for (; n < 21; ) {
                        if (n == speed) {
                            let finalSpeed = speed * 5;
                            ((finalSpeed = finalSpeed + "%"),
                                gsap.to(element, {
                                    top: finalSpeed,
                                    scrollTrigger: {
                                        trigger: parentEl,
                                        start: "top top-=5px",
                                        end: "bottom top-=5px",
                                        scrub: !0,
                                    },
                                }));
                        }
                        n++;
                    }
                }
            }
        });
    }
    heroParallaxVaribleSpeeds(
        ".sk__layered-parallax-header .sk__layered-parallax-element",
    );
    function parallaxHeroVerticalStrips() {
        let strips = $(".sk__hero-section .sk__hero-parallax-strip-vertical");
        if (strips.length) {
            let numberOfStrips = strips.length,
                parent = $(strips).parent(),
                width = 100 / numberOfStrips;
            $(parent)
                .find(".sk__hero-parallax-strip-vertical")
                .css("width", width + "vw");
            let n = 0;
            for (; n < numberOfStrips; )
                (n > 0 &&
                    $(parent)
                        .find(
                            ".sk__hero-parallax-strip-vertical:nth-child(" +
                                (n + 1) +
                                ")",
                        )
                        .css("left", width * n + "vw"),
                    n++);
        }
        heroParallaxVaribleSpeeds(".sk__hero-parallax-strip-vertical");
    }
    (parallaxHeroVerticalStrips(),
        gsap.utils.toArray(".sk__counter").forEach((element) => {
            let clean = (v) => (v + "").replace(/[^\d\.-]/gi, ""),
                num = clean(element.getAttribute("data-gsap-counter-number")),
                decimals = (num.split(".")[1] || "").length,
                proxy = { val: parseFloat(clean(element.innerText)) || 0 };
            gsap.to(proxy, {
                val: +num,
                duration: 2,
                scrollTrigger: {
                    trigger: element,
                    toggleActions: "restart none none none",
                },
                onUpdate: () =>
                    (element.innerText = formatNumber(proxy.val, decimals)),
            });
        }));
    function formatNumber(value, decimals) {
        let s = (+value).toLocaleString("en-US").split(".");
        return decimals
            ? s[0] + "." + ((s[1] || "") + "00000000").substr(0, decimals)
            : s[0];
    }
    let heroSliderNavUI = $(
        "#sk__hero-carousel-slider .carousel-control-next, #sk__hero-carousel-slider .carousel-control-prev",
    );
    if (heroSliderNavUI.length) {
        let theDelay = effectsMasterDelay + 1;
        gsap.timeline().fromTo(
            heroSliderNavUI,
            { opacity: 0 },
            {
                opacity: 0.5,
                duration: 0.3,
                stagger: { amount: 0.25, from: "end", grid: "auto" },
                delay: theDelay,
            },
        );
    }
    let heroSliderNavDots = $(
        "#sk__hero-carousel-slider .carousel-indicators button",
    );
    if (heroSliderNavDots.length) {
        let theDelay = effectsMasterDelay + 0.5;
        gsap.timeline().fromTo(
            heroSliderNavDots,
            { opacity: 0 },
            {
                opacity: 1,
                duration: 0.3,
                stagger: { amount: 0.25, from: "end", grid: "auto" },
                delay: theDelay,
            },
        );
    }
    function equalizeHeroBoxesHeights() {
        let w = window.innerWidth;
        $(".sk__hero-section .carousel-item").each(function () {
            let heroBottomLeftDivHeight = $(this)
                .find(".hero-box-bottom-left")
                .height();
            w >= 1800
                ? $(this)
                      .find(".flex-helper-div")
                      .css("height", heroBottomLeftDivHeight + "px")
                : w >= 1281 && w <= 1799
                  ? $(this)
                        .find(".flex-helper-div")
                        .css("height", heroBottomLeftDivHeight * 0.75 + "px")
                  : w >= 992 && w <= 1280
                    ? $(this)
                          .find(".flex-helper-div")
                          .css("height", heroBottomLeftDivHeight * 0.6 + "px")
                    : w >= 768 && w <= 991
                      ? $(this)
                            .find(".flex-helper-div")
                            .css(
                                "height",
                                heroBottomLeftDivHeight * 0.82 + "px",
                            )
                      : $(this)
                            .find(".flex-helper-div")
                            .css(
                                "height",
                                heroBottomLeftDivHeight * 0.2 + "px",
                            );
        });
    }
    equalizeHeroBoxesHeights();
    function alignSocialsWithHeading() {
        var socials = $(".hero-socials"),
            heading = $(".carousel-item.active .hero-h1-box .hero-h1"),
            socialsHeight = 421;
        if (
            (socials.length && (socialsHeight = socials.outerHeight()),
            socials.length && heading.length)
        ) {
            var scrollTop = $(window).scrollTop(),
                headingHeight = heading.height();
            if (headingHeight) {
                var headingOffset = heading.parent().offset().top,
                    headingY = headingOffset - scrollTop,
                    headingCenter = headingY + headingHeight / 2,
                    correction = headingCenter - socialsHeight / 2;
                socials.css("top", correction + "px");
            }
        }
        if (socials.length && !heading.length) {
            var socialsHalfHeight = socialsHeight / 2,
                distance = vh(50) - socialsHalfHeight;
            socials.css("top", distance + "px");
        }
    }
    alignSocialsWithHeading();
    function areRingsPortrait() {
        let w = $("#sk__parallax-layers-1").width() + 2;
        var h = window.innerHeight;
        if (h > w) return !0;
    }
    function areRingsExitingScreenVertically($element) {
        var element = $($element);
        let rh = $(element).height(),
            h = window.innerHeight;
        if (rh > h) return !0;
    }
    function widthsRelativeToParent() {
        var parentWidth = $("#sk__parallax-layers-1").width(),
            mWidth = parentWidth * 0.77707,
            sWidth = parentWidth * 0.550318;
        ($(".ring-l").css({
            width: parentWidth + "px",
            height: parentWidth + "px",
        }),
            $(".ring-m").css({ width: mWidth + "px", height: mWidth + "px" }),
            $(".ring-s").css({ width: sWidth + "px", height: sWidth + "px" }));
    }
    function ringsResetDimensions() {
        ($(".ring-l").css({ width: "785px", height: "785px" }),
            $(".ring-m").css({ width: "610px", height: "610px" }),
            $(".ring-s").css({ width: "432px", height: "432px" }));
    }
    function ringsLimitDimensions() {
        ($(".ring-l").css({ width: "98vh", height: "98vh" }),
            $(".ring-m").css({ width: "76.1529vh", height: "76.1529vh" }),
            $(".ring-s").css({ width: "59.9312vh", height: "59.9312vh" }));
    }
    function manageRingsSection() {
        (screenRatio < 0.5656 &&
            $(".sk__rings-section > .sk__full-height").css("height", "63vh"),
            screenRatio >= 0.5656 &&
                screenRatio <= 0.78358 &&
                $(".sk__rings-section > .sk__full-height").css(
                    "height",
                    "76vh",
                ),
            screenRatio > 0.78358 &&
                $(".sk__rings-section > .sk__full-height").css(
                    "height",
                    "100vh",
                ),
            areRingsPortrait()
                ? ($(".ring-l, .ring-m, .ring-s").addClass("portrait"),
                  $(".ring-l, .ring-m, .ring-s").removeClass("landscape"),
                  widthsRelativeToParent())
                : ($(".ring-l, .ring-m, .ring-s").addClass("landscape"),
                  $(".ring-l, .ring-m, .ring-s").removeClass("portrait"),
                  ringsResetDimensions(),
                  areRingsExitingScreenVertically(".ring-l") &&
                      ringsLimitDimensions()));
    }
    manageRingsSection();
    function hugeDecorativeVerticalTexts() {
        let w = window.innerWidth,
            h = window.innerHeight;
        w / h > 1 &&
            $(".sk__huge-vertical-deco-text-section").each(function () {
                let trigger = $(this),
                    hugeTextVrapper = $(this).find(
                        ".sk__huge-vertical-deco-text-wrapper",
                    ),
                    hugeVerticalText = $(this).find(
                        ".sk__huge-vertical-deco-text",
                    );
                if (hugeTextVrapper.length && hugeVerticalText.length) {
                    $(hugeTextVrapper).css("display", "block");
                    let wrapperWidth = $(hugeTextVrapper).width(),
                        distance = $(hugeVerticalText).width();
                    gsap.fromTo(
                        hugeVerticalText,
                        { x: wrapperWidth + wrapperWidth / 2 },
                        {
                            x: -distance + wrapperWidth * 0.4,
                            scrollTrigger: {
                                trigger,
                                start: "top bottom",
                                end: "bottom top",
                                scrub: !0,
                            },
                        },
                    );
                }
            });
    }
    function warpedText() {
        var warpTextSection = $("section.sk__cta-warp:not(.not-animated)");
        if (warpTextSection.length)
            if (isMobile != !0) {
                $(
                    ".sk__cta-warp:not(.not-animated) .sk__warped-text-wrapper",
                ).each(function () {
                    let wrapper = $(this),
                        classnameL = "",
                        classnameR = "",
                        distance = 1,
                        n = 1;
                    for (; n < 6; )
                        ((classnameL = "warped-text-clone-l" + n),
                            (classnameR = "warped-text-clone-r" + n),
                            $(this)
                                .clone()
                                .insertBefore(this)
                                .addClass(classnameL),
                            $(this)
                                .clone()
                                .insertBefore(this)
                                .addClass(classnameR),
                            n++);
                });
                var warpTextOriginalElement = $(
                    '.sk__cta-warp:not(.not-animated) .sk__warped-text-wrapper:not([class*="clone"]) .sk__warped-text',
                );
                if (warpTextOriginalElement.length) {
                    ($(warpTextOriginalElement).addClass(
                        "sk__gradient-fancy-text",
                    ),
                        gsap.to(
                            '.sk__cta-warp:not(.not-animated) .sk__warped-text-wrapper:not([class*="clone"])',
                            {
                                opacity: 1,
                                ease: "power1.out",
                                duration: 1.2,
                                scrollTrigger: {
                                    trigger:
                                        '.sk__warped-text-wrapper:not([class*="clone"])',
                                    toggleActions: "play play reverse reverse",
                                    start: "top 80%",
                                    end: "top 50%",
                                    scrub: !1,
                                },
                            },
                        ));
                    let warpTextOriginalElementTL = gsap.timeline({
                        scrollTrigger: {
                            trigger: warpTextSection,
                            start: "top 80%",
                            toggleClass: {
                                targets: warpTextOriginalElement,
                                className: "deblur",
                            },
                        },
                    });
                    gsap.to(
                        '.sk__cta-warp:not(.not-animated) .sk__warped-text-wrapper[class*="warped-text-clone"]',
                        {
                            x: 0,
                            opacity: 0,
                            ease: "power1.out",
                            duration: 1.2,
                            scrollTrigger: {
                                trigger:
                                    '.sk__warped-text-wrapper:not([class*="clone"])',
                                toggleActions: "play play reverse reverse",
                                start: "top 80%",
                                end: "top 50%",
                                scrub: !1,
                            },
                        },
                    );
                    let warpedTextColorTL = gsap.timeline({
                        scrollTrigger: {
                            trigger:
                                '.sk__cta-warp:not(.not-animated) .sk__warped-text-wrapper:not([class*="clone"])',
                            start: "top 80%",
                            toggleClass: {
                                targets:
                                    ".sk__cta-warp:not(.not-animated) .sk__warped-text",
                                className: "sk__warped-text-color-changed",
                            },
                        },
                    });
                }
                var warpedTexth3 = $(".sk__cta-warp h3");
                if (warpedTexth3.length) {
                    let warpedTexth3TL = gsap.timeline({
                        scrollTrigger: {
                            trigger:
                                '.sk__cta-warp:not(.not-animated) .sk__warped-text-wrapper:not([class*="clone"])',
                            start: "top 80%",
                            toggleClass: {
                                targets:
                                    ".sk__cta-warp:not(.not-animated).sk__cta-warp h3",
                                className: "sk__cta-warp-h3-unspaced",
                            },
                        },
                    });
                }
                var warpedTextButton = $(".btn.sk__warped-button");
                warpedTextButton.length &&
                    gsap.fromTo(
                        warpedTextButton,
                        { opacity: 0 },
                        {
                            opacity: 1,
                            delay: 0.65,
                            ease: "power1.out",
                            duration: 0.3,
                            scrollTrigger: {
                                trigger:
                                    '.sk__warped-text-wrapper:not([class*="clone"])',
                                toggleActions: "play play reverse reverse",
                                start: "top 80%",
                            },
                        },
                    );
            } else
                ($(".sk__warped-text-wrapper").css("opacity", "1"),
                    $(".sk__warped-text-wrapper .sk__warped-text").addClass(
                        "sk__gradient-fancy-text deblur",
                    ),
                    $(".sk__cta-warp h3").addClass("sk__cta-warp-h3-unspaced"),
                    $(".btn.sk__warped-button").css("opacity", "1"));
    }
    ($(
        '.sk__cta-warp.not-animated .sk__warped-text-wrapper:not([class*="clone"]) .sk__warped-text',
    ).addClass("sk__gradient-fancy-text"),
        $(".sk__cta-warp.not-animated .sk__warped-text-wrapper").css(
            "opacity",
            "1",
        ),
        $(".sk__cta-warp.not-animated h3").addClass("sk__cta-warp-h3-unspaced"),
        $(
            ".sk__cta-warp.not-animated .sk__warped-text-wrapper .sk__warped-text",
        ).addClass("sk__gradient-fancy-text deblur"));
    function warpedTextAlign() {
        $(
            '.sk__cta-warp:not(.not-animated) .sk__warped-text-wrapper[class*="clone"]',
        ).each(function () {
            var clone = $(this),
                original = $(this)
                    .parentsUntil(".sk__cta-warp:not(.not-animated)")
                    .find('.sk__warped-text-wrapper:not([class*="clone"])'),
                originalPosition = original.position();
            let w = original.innerWidth();
            $(clone)
                .css("width", w + "px")
                .css("margin-left", originalPosition.left + "px");
            var cloneY = clone.offset().top,
                originalY = original.offset().top,
                difference = 1;
            cloneY < originalY &&
                ((difference = originalY - cloneY),
                $(clone).css("margin-top", difference + "px"));
        });
    }
    ($("#sk__hero-carousel-slider").bind("slide.bs.carousel", function (e) {
        (dispatchResizeExceptOn("sk__has-youtube-video"),
            homeHeroSliderExitAnimations());
    }),
        $("#sk__hero-carousel-slider").bind("slid.bs.carousel", function (e) {
            (equalizeHeroBoxesHeights(),
                homeHeroSliderEntranceAnimations(),
                alignSocialsWithHeading());
        }),
        $(".sk__project-gallery").each(function (i) {
            $(this).attr("id", "sk__project-gallery" + i);
            var galleryNumber = i + 1;
            $("body").prepend(
                '<div id="sk__parallax-gallery-nav-' +
                    (i + 1) +
                    '" class="sk__parallax-gallery-nav"><div class="sk__parallax-gallery-nav-icon"></div></div>',
            );
            var items = $(this).find(".sk__gallery-item");
            $(items).each(function (i2) {
                $(this).attr(
                    "id",
                    "sk__gallery-" + galleryNumber + "-item-" + (i2 + 1),
                );
            });
            var numberOfItems = $(items).length;
            let n = 1;
            for (; n < numberOfItems + 1; )
                ($("#sk__parallax-gallery-nav-" + (i + 1)).append(
                    '<a id="sk__gallery-' +
                        (i + 1) +
                        "-nav-link-" +
                        n +
                        '" href="#sk__gallery-' +
                        (i + 1) +
                        "-item-" +
                        n +
                        '" class="sk__gallery-nav-link" data-gallery-item-number="' +
                        n +
                        '"></a>',
                ),
                    (window["activeNavDotTL" + n] = gsap.timeline({
                        scrollTrigger: {
                            trigger: "#sk__gallery-" + (i + 1) + "-item-" + n,
                            start: "top 40%",
                            end: "bottom 40%",
                            toggleClass: {
                                targets:
                                    "#sk__gallery-" +
                                    (i + 1) +
                                    "-nav-link-" +
                                    n,
                                className: "active",
                            },
                        },
                    })),
                    n++);
            var section = $(this),
                thisNavInstance = $("#sk__parallax-gallery-nav-" + (i + 1)),
                firstImage = items[0];
            let navVisibilityTL = gsap.timeline({
                scrollTrigger: {
                    trigger: firstImage,
                    endTrigger: section,
                    start: "center center+=360px",
                    end: "bottom 70%",
                    toggleClass: {
                        targets: thisNavInstance,
                        className: "sk__gallery-nav-visible",
                    },
                },
            });
        }),
        $(".sk__gallery-basic-thumbnails").each(function () {
            let gallery = $(this),
                numb = $(this).find(".carousel-inner .carousel-item").length;
            if (numb >= 1) {
                $(gallery)
                    .find(".carousel")
                    .append(
                        '<div class="carousel-indicators sk__flex-center"></div>',
                    );
                let thumbsWrap = $(gallery).find(".carousel-indicators"),
                    n = 0,
                    classHTML = "";
                for (; n < numb; ) {
                    let img = $(gallery).find(
                        ".carousel-item:nth-child(" + (n + 1) + ") img",
                    );
                    ($(gallery)
                        .find(".carousel-item:nth-child(" + (n + 1) + ")")
                        .attr("class")
                        .includes("active")
                        ? (classHTML = 'class="active"')
                        : (classHTML = ""),
                        $(thumbsWrap).append(
                            '<button type="button" data-bs-target="#sk__project-1-gallery-basic" data-bs-slide-to="' +
                                n +
                                '" ' +
                                classHTML +
                                "></button>",
                        ));
                    let button = $(thumbsWrap).find(
                        'button[data-bs-slide-to="' + n + '"]',
                    );
                    ($(img).clone().prependTo(button), n++);
                }
            }
        }));
    function iconboxCloneIcons() {
        $(".sk__iconbox .sk__iconbox-icon-link > span.sk__iconbox-icon").each(
            function () {
                if ($(this).length) {
                    let i = 1;
                    for (; i < 4; )
                        ($(this)
                            .clone()
                            .html('<span class="sk__iconbox-trail"></span>')
                            .insertAfter(this),
                            i++);
                }
            },
        );
    }
    (revealText(
        ".sk__reveal-header-text .cover-text-wrapper h1, .sk__reveal-header-text.cover-text-wrapper h1",
        0.4,
        0.4,
    ),
        revealText(
            ".sk__reveal-header-text .cover-text-wrapper h2, .sk__reveal-header-text.cover-text-wrapper h2",
            0.4,
            0.6,
            0.3,
            "top",
        ),
        revealText(
            ".sk__reveal-header-text .cover-text-wrapper p, .sk__reveal-header-text.cover-text-wrapper p",
            0.4,
            0.8,
            0.3,
            "top",
        ),
        scrollRevealText(
            ".sk__reveal-all-wrapped-text .cover-text-wrapper > *, .sk__reveal-all-wrapped-text.cover-text-wrapper > *",
            0.4,
            0.4,
            0,
            "bottom",
            !1,
            !1,
            !1,
            "play complete",
        ),
        $(".sk__edge-beauty").prepend(
            '<div class="sk__edge-beauty-top"></div><div class="sk__edge-beauty-bottom"></div><div class="sk__edge-beauty-bottom-shadow"></div>',
        ));
    let heroBackgroundOnScroll = $(
        ".carousel-item .sk__parallax-background-element",
    );
    heroBackgroundOnScroll.length &&
        gsap.fromTo(
            heroBackgroundOnScroll,
            { filter: "brightness(1)" },
            {
                filter: "brightness(0.1)",
                scrollTrigger: {
                    trigger: ".sk__hero-section",
                    start: "top top-=1%",
                    end: "top top-=85%",
                    scrub: !0,
                },
            },
        );
    let heroAnimatedElements = $(
        ".sk__hero-section .animated-element",
    ).parent();
    if (
        (heroAnimatedElements.length &&
            gsap.fromTo(
                heroAnimatedElements,
                { opacity: 1 },
                {
                    y: 0,
                    opacity: 0,
                    scrollTrigger: {
                        trigger: ".sk__hero-section",
                        start: "top top-=1%",
                        end: "top top-=25%",
                        scrub: !0,
                    },
                },
            ),
        $(".hero-socials-section").length)
    ) {
        gsap.fromTo(
            ".hero-socials-section",
            { y: 0, opacity: 1 },
            {
                y: 100,
                opacity: 0,
                scrollTrigger: {
                    trigger: "#smooth-content section:first-child",
                    start: "top top-=1%",
                    end: "top top-=50%",
                    scrub: !0,
                },
            },
        );
        let disappearSocialsTL = gsap.timeline({
            scrollTrigger: {
                trigger: "body",
                start: "top -90%",
                toggleClass: { targets: ".hero-socials", className: "d-none" },
            },
        });
    }
    let heroMegaTextOnScroll = $(
        ".sk__hero-section.sk__mega-video-text-section",
    );
    heroMegaTextOnScroll.length &&
        gsap.fromTo(
            heroMegaTextOnScroll,
            { filter: "brightness(1)" },
            {
                filter: "brightness(0.1)",
                yPercent: 30,
                scrollTrigger: {
                    trigger: heroMegaTextOnScroll,
                    start: "top top-=1%",
                    end: "top top-=85%",
                    scrub: !0,
                },
            },
        );
    let heroSliderIndicators = $(".sk__hero-section .carousel-indicators");
    if (
        (heroSliderIndicators.length &&
            gsap.fromTo(
                heroSliderIndicators,
                { opacity: 1 },
                {
                    y: 0,
                    opacity: 0,
                    scrollTrigger: {
                        trigger: ".sk__hero-section",
                        start: "top top-=1%",
                        end: "top top-=25%",
                        scrub: !0,
                    },
                },
            ),
        $(".hero-socials span").length)
    ) {
        let socIconsDelay = effectsMasterDelay - 0.3;
        socIconsDelay < 0 && (socIconsDelay = 0);
        let heroSocialIcons = gsap.timeline().to(".hero-socials span", {
            scale: 1,
            opacity: 1,
            duration: 1.3,
            ease: "power1.out",
            delay: socIconsDelay,
            stagger: 0.05,
        });
    }
    if (
        ($(
            ".fancy-gradient-text-box h1.sk__gradient-fancy-text, .fancy-gradient-text-box h2.sk__gradient-fancy-text, .fancy-gradient-text-box h3.sk__gradient-fancy-text, .fancy-gradient-text-box h4.sk__gradient-fancy-text, .fancy-gradient-text-box h5.sk__gradient-fancy-text, .fancy-gradient-text-box h6.sk__gradient-fancy-text",
        ).each(function () {
            let insideHTML = $(this).html(),
                classes = $(this).attr("class");
            if (classes.length) {
                let newClasses = classes.replace(
                    "sk__gradient-fancy-text",
                    "sk__gradient-fancy-text-back",
                );
                $(
                    '<span class="' +
                        newClasses +
                        '"> ' +
                        insideHTML +
                        "</span>",
                ).insertAfter(this);
            }
        }),
        $(".sk__halfscreen-text-col").each(function () {
            let halfScreenSectionsText = $(this),
                halfScreenTextElements = $(this).find(".animated-element");
            halfScreenSectionsText.length &&
                halfScreenTextElements.length &&
                gsap.fromTo(
                    halfScreenTextElements,
                    { opacity: 0, y: 40 },
                    {
                        opacity: 1,
                        y: 0,
                        ease: "power1.out",
                        scrollTrigger: {
                            trigger: halfScreenSectionsText,
                            start: "top 50%",
                            end: "top 30%",
                            toggleActions: "play complete reverse pause",
                        },
                        stagger: 0.08,
                    },
                );
        }),
        isMobile != !0)
    ) {
        let portfoilioThumbnailsSlider = $(
            ".sk__portfolio-wrapper:not(.not-slick)",
        );
        portfoilioThumbnailsSlider.length &&
            (gsap.from(portfoilioThumbnailsSlider, {
                x: 900,
                ease: "back",
                scrollTrigger: {
                    trigger: portfoilioThumbnailsSlider,
                    start: "top bottom",
                    end: "top 25%",
                    scrub: !0,
                },
            }),
            gsap.fromTo(
                portfoilioThumbnailsSlider,
                { x: 0 },
                {
                    x: -900,
                    ease: "power1.inOut",
                    scrollTrigger: {
                        trigger: portfoilioThumbnailsSlider,
                        start: "bottom 45%",
                        end: "bottom top",
                        scrub: !0,
                    },
                },
            ));
    }
    (massFadeIn(
        ".sk__portfolio-page .sk__portfolio-wrapper.not-slick",
        ".sk__portfolio-item",
        0.05,
        !1,
        1,
        2,
    ),
        massFadeIn(
            ".sk__home-portfolio .sk__portfolio-wrapper.not-slick",
            ".sk__portfolio-item",
            0.05,
            !1,
            0,
            2,
        ));
    let aboutUsImage = $(".about-right-image"),
        aboutUsImageSubwrap = $(".about-right-image-subwrap");
    aboutUsImage.length &&
        aboutUsImageSubwrap.length &&
        (gsap.from(".about-right-image", {
            scale: 1.5,
            scrollTrigger: {
                trigger: ".about-right-image-subwrap",
                toggleActions: "play complete reverse pause",
                start: "top 80%",
                end: "top 20%",
                delay: 0.2,
                scrub: !0,
            },
        }),
        gsap.from(".about-right-image-subwrap", {
            scrollTrigger: {
                trigger: ".about-right-image-subwrap",
                toggleActions: "play complete reverse pause",
                start: "top 80%",
                end: "top 20%",
                scrub: !0,
            },
            height: 0,
            ease: "power1",
        }));
    let partnersImages = $(".sk__partners > div");
    partnersImages.length &&
        gsap.fromTo(
            partnersImages,
            { opacity: 0 },
            {
                opacity: 1,
                scrollTrigger: {
                    trigger: ".sk__partners",
                    start: "top 99%",
                    end: "bottom 80%",
                    scrub: !0,
                },
                stagger: 0.3,
            },
        );
    function featuresFadeIn($selector, $delayTime) {
        let featuresItems = $($selector),
            delayTime = $delayTime;
        featuresItems.length &&
            gsap.fromTo(
                featuresItems,
                { opacity: 0 },
                {
                    opacity: 1,
                    delay: delayTime,
                    duration: 0.4,
                    scrollTrigger: {
                        trigger: ".sk__features",
                        start: "top 99%",
                        end: "bottom 85%",
                    },
                    stagger: 0.1,
                },
            );
    }
    (featuresFadeIn(".sk__features:not(.delayed) .sk__feature-col", 0),
        featuresFadeIn(".sk__features.delayed .sk__feature-col", 1.3),
        massFadeIn(
            ".sk__featureboxes",
            ".sk__featurebox-col",
            0.1,
            !1,
            0.2,
            2,
        ));
    let laptopMockup = $(".sk__laptop-mockup-subcontainer");
    laptopMockup.length &&
        gsap.fromTo(
            laptopMockup,
            { opacity: 0, xPercent: -5 },
            {
                opacity: 1,
                xPercent: 0,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: laptopMockup,
                    start: "top 70%",
                    end: "top 30%",
                    toggleActions: "play complete",
                    scrub: !1,
                },
                duration: 1,
            },
        );
    function browserMockupsAnimate() {
        $(".sk__browsers-wrapper").each(function () {
            let browserMockups = [
                    ".sk__browsers-wrapper > .sk__browsers-tablet",
                    ".sk__browsers-wrapper > .sk__browsers-desktop",
                    ".sk__browsers-wrapper > .sk__browsers-phone",
                ],
                n = 0;
            for (; n < 3; ) {
                let theDelay = 0.2,
                    fromLeft = "30%",
                    toLeft = "0",
                    fromBottom = 0,
                    theOpacity = 0;
                (n == 0 && (theDelay = 0.6),
                    n == 1 &&
                        ((fromLeft = "25.757575%"),
                        (toLeft = "25.757575%"),
                        (fromBottom = "-120%"),
                        (theOpacity = 1)),
                    n == 2 &&
                        ((fromLeft = "64.0326332%"),
                        (toLeft = "84.0326332%"),
                        (theDelay = 0.6)));
                let element = $(browserMockups[n]);
                (element.length &&
                    gsap.fromTo(
                        element,
                        {
                            bottom: fromBottom,
                            left: fromLeft,
                            opacity: theOpacity,
                        },
                        {
                            opacity: 1,
                            bottom: 0,
                            left: toLeft,
                            ease: "power1.inOut",
                            scrollTrigger: {
                                trigger: ".sk__browsers-wrapper",
                                start: "top 90%",
                                end: "top top-=200px",
                                toggleActions: "play complete",
                                scrub: !1,
                            },
                            duration: 0.8,
                            delay: theDelay,
                        },
                    ),
                    n++);
            }
        });
    }
    (browserMockupsAnimate(),
        $(".sk__skill-wrap").each(function () {
            var amount = $(this).find(".sk__counterskills").html(),
                skillBar = $(this).find(".sk__skill-bar");
            $(skillBar).css("width", amount + "%");
        }));
    let skillBarEl = $(".sk__skill-bar");
    if (skillBarEl.length) {
        let skillBars = gsap.timeline();
        gsap.fromTo(
            skillBarEl,
            { scaleX: 0 },
            {
                scaleX: 1,
                duration: 0.9,
                scrollTrigger: {
                    trigger: ".sk__skills-row",
                    toggleActions: "play play reverse reverse",
                    start: "bottom 99%",
                    end: "bottom 20%",
                },
                stagger: 0.1,
            },
        );
    }
    (scrollRevealText(
        "body:not(.sk__services-page) #services .cover-text-wrapper h1",
        0.3,
        0,
        0,
        "bottom",
        !1,
        "top 90%",
        "top 20%",
        "play complete reverse pause",
    ),
        scrollRevealText(
            "body:not(.sk__services-page) #services .cover-text-wrapper h2",
            0.4,
            0.6,
            0.3,
            "bottom",
            !1,
            "top 90%",
            "top 20%",
            "play complete reverse pause",
        ),
        scrollRevealText(
            "body:not(.sk__services-page) #services .cover-text-wrapper p",
            0.4,
            0.8,
            0.3,
            "bottom",
            !1,
            "top 90%",
            "top 20%",
            "play complete reverse pause",
        ));
    let iconBoxIcon = $(
            ".sk__services-page .sk__iconbox .sk__iconbox-icon-link",
        ),
        iconBoxTextLink = $(
            ".sk__services-page .sk__iconbox .sk__iconbox-text-link",
        ),
        iconBoxParagraph = $(".sk__services-page .sk__iconbox > p");
    function iconBoxElementsEntrance($element) {
        let element = $element,
            iconBoxTL = gsap
                .timeline()
                .fromTo(
                    element,
                    { x: -100, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.9, delay: 1, stagger: 0.1 },
                );
    }
    (iconBoxIcon.length && iconBoxElementsEntrance(iconBoxIcon),
        iconBoxTextLink.length && iconBoxElementsEntrance(iconBoxTextLink),
        iconBoxParagraph.length && iconBoxElementsEntrance(iconBoxParagraph));
    let projectHeaderSection = $(".sk__project-header");
    if (projectHeaderSection.length) {
        let projectHeaderDelay = effectsMasterDelay - 1;
        if (
            (projectHeaderDelay < 0 && (projectHeaderDelay = 0), isMobile != !0)
        ) {
            gsap.fromTo(
                projectHeaderSection,
                { filter: "brightness(1)" },
                {
                    filter: "brightness(0)",
                    yPercent: 20,
                    scrollTrigger: {
                        trigger: projectHeaderSection,
                        start: "top top-=100px",
                        end: "top top-=85%",
                        scrub: !0,
                    },
                },
            );
            let phsThumbnailLandscapeImg = $(
                    ".sk__project-header .sk__project-thumbnail-landscape-col img",
                ),
                phsThumbnailLandscapeCover = $(
                    ".sk__project-header .sk__project-thumbnail-landscape-cover",
                );
            if (
                phsThumbnailLandscapeImg.length &&
                phsThumbnailLandscapeCover.length
            ) {
                let phsThumbnailLandscapeDelay = 0.5 + projectHeaderDelay,
                    phsThumbnailLandscape = gsap
                        .timeline()
                        .set(phsThumbnailLandscapeCover, { scaleX: 0 })
                        .fromTo(
                            phsThumbnailLandscapeCover,
                            { scaleX: 0 },
                            {
                                scaleX: 1,
                                duration: 0.65,
                                delay: phsThumbnailLandscapeDelay,
                                transformOrigin: "right center",
                                ease: "power1.in",
                            },
                        )
                        .set(phsThumbnailLandscapeImg, { opacity: 1 })
                        .fromTo(
                            phsThumbnailLandscapeCover,
                            { scaleX: 1 },
                            {
                                scaleX: 0,
                                duration: 0.65,
                                delay: 0.1,
                                transformOrigin: "left center",
                                ease: "power1.out",
                            },
                        );
            }
            let phsThumbnailPortraitImg = $(
                    ".sk__project-header .sk__project-thumbnail-portrait-col img",
                ),
                phsThumbnailPortraitCover = $(
                    ".sk__project-header .sk__project-thumbnail-portrait-cover",
                );
            if (
                phsThumbnailPortraitImg.length &&
                phsThumbnailPortraitCover.length
            ) {
                let phsThumbnailPortraitDelay = 1.2 + projectHeaderDelay,
                    phsThumbnailPortrait = gsap
                        .timeline()
                        .set(phsThumbnailPortraitCover, { scaleY: 0 })
                        .fromTo(
                            phsThumbnailPortraitCover,
                            { scaleY: 0 },
                            {
                                scaleY: 1,
                                duration: 0.65,
                                delay: phsThumbnailPortraitDelay,
                                transformOrigin: "center top",
                                ease: "power1.in",
                            },
                        )
                        .set(phsThumbnailPortraitImg, { opacity: 1 })
                        .fromTo(
                            phsThumbnailPortraitCover,
                            { scaleY: 1 },
                            {
                                scaleY: 0,
                                duration: 0.65,
                                delay: 0.1,
                                transformOrigin: "center bottom",
                                ease: "power1.out",
                            },
                        );
            }
            let pshInfoBox = $(".sk__project-infoboxes"),
                phsInfoBoxH4 = $(".sk__project-infoboxes h4"),
                phsInfoBoxDivider = $(".sk__project-infoboxes .fat-divider"),
                phsInfoBoxTexts1 = $(
                    ".sk__project-infoboxes .sk__proj-infobox-label",
                ),
                phsInfoBoxTexts2 = $(
                    ".sk__project-infoboxes .sk__proj-infobox-value",
                );
            if (
                pshInfoBox.length &&
                phsInfoBoxH4.length &&
                phsInfoBoxDivider.length &&
                phsInfoBoxTexts1.length &&
                phsInfoBoxTexts2.length
            ) {
                let pshInfoBoxDelay = 0.8 + projectHeaderDelay,
                    phsInfoBoxTL = gsap
                        .timeline()
                        .fromTo(
                            phsInfoBoxDivider,
                            { scaleX: 0 },
                            {
                                scaleX: 1,
                                duration: 0.65,
                                delay: pshInfoBoxDelay,
                                transformOrigin: "right center",
                                ease: "power1.out",
                            },
                        )
                        .to(
                            phsInfoBoxTexts1,
                            { opacity: 1, duration: 0.3, stagger: 0.05 },
                            "-=0.25",
                        )
                        .to(
                            phsInfoBoxTexts2,
                            { opacity: 1, duration: 0.3, stagger: 0.05 },
                            "<0.1",
                        )
                        .fromTo(
                            phsInfoBoxH4,
                            { opacity: 0, y: -100 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.65,
                                ease: "power1.out",
                            },
                            "-=1.2",
                        );
            }
            let phsHeading = $(".sk__project-main-heading h1");
            if (phsHeading.length) {
                let phsHeadingDelay = 2 + projectHeaderDelay;
                gsap.fromTo(
                    phsHeading,
                    { yPercent: 0 },
                    {
                        yPercent: -140,
                        opacity: 1,
                        duration: 0.65,
                        delay: phsHeadingDelay,
                        ease: "power1.out",
                    },
                );
            }
            let phsSubHeading = $(".sk__project-main-heading h2");
            if (phsSubHeading.length) {
                let phsSubHeadingDelay = 2.3 + projectHeaderDelay;
                gsap.fromTo(
                    phsSubHeading,
                    { yPercent: 0 },
                    {
                        yPercent: 100,
                        opacity: 1,
                        duration: 0.65,
                        delay: phsSubHeadingDelay,
                        ease: "power1.out",
                    },
                );
            }
        } else {
            let phsHeading = $(".sk__project-main-heading h1");
            if (phsHeading.length) {
                let phsHeadingDelay = 0.5 + projectHeaderDelay;
                gsap.fromTo(
                    phsHeading,
                    { yPercent: 0 },
                    {
                        yPercent: -140,
                        opacity: 1,
                        duration: 0.65,
                        delay: phsHeadingDelay,
                        ease: "power1.out",
                    },
                );
            }
            let phsSubHeading = $(".sk__project-main-heading h2");
            if (phsSubHeading.length) {
                let phsSubHeadingDelay = 0.8 + projectHeaderDelay;
                gsap.fromTo(
                    phsSubHeading,
                    { yPercent: 0 },
                    {
                        yPercent: 100,
                        opacity: 1,
                        duration: 0.65,
                        delay: phsSubHeadingDelay,
                        ease: "power1.out",
                    },
                );
            }
            let pshInfoBox = $(".sk__project-infoboxes"),
                phsInfoBoxH4 = $(".sk__project-infoboxes h4"),
                phsInfoBoxDivider = $(".sk__project-infoboxes .fat-divider"),
                phsInfoBoxTexts1 = $(
                    ".sk__project-infoboxes .sk__proj-infobox-label",
                ),
                phsInfoBoxTexts2 = $(
                    ".sk__project-infoboxes .sk__proj-infobox-value",
                );
            if (
                pshInfoBox.length &&
                phsInfoBoxH4.length &&
                phsInfoBoxDivider.length &&
                phsInfoBoxTexts1.length &&
                phsInfoBoxTexts2.length
            ) {
                let pshInfoBoxDelay = 1 + projectHeaderDelay,
                    phsInfoBoxTL = gsap
                        .timeline()
                        .fromTo(
                            phsInfoBoxDivider,
                            { scaleX: 0 },
                            {
                                scaleX: 1,
                                duration: 0.65,
                                delay: pshInfoBoxDelay,
                                transformOrigin: "right center",
                                ease: "power1.out",
                            },
                        )
                        .to(
                            phsInfoBoxTexts1,
                            { opacity: 1, duration: 0.3, stagger: 0.05 },
                            "-=0.25",
                        )
                        .to(
                            phsInfoBoxTexts2,
                            { opacity: 1, duration: 0.3, stagger: 0.05 },
                            "<0.1",
                        )
                        .fromTo(
                            phsInfoBoxH4,
                            { opacity: 0, y: -100 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.65,
                                ease: "power1.out",
                            },
                            "-=1.2",
                        );
            }
            let phsThumbnailLandscapeImg = $(
                    ".sk__project-header .sk__project-thumbnail-landscape-col img",
                ),
                phsThumbnailLandscapeCover = $(
                    ".sk__project-header .sk__project-thumbnail-landscape-cover",
                );
            if (
                phsThumbnailLandscapeImg.length &&
                phsThumbnailLandscapeCover.length
            ) {
                let phsThumbnailLandscapeDelay = 1.3 + projectHeaderDelay,
                    phsThumbnailLandscape = gsap
                        .timeline()
                        .set(phsThumbnailLandscapeCover, { scaleX: 0 })
                        .fromTo(
                            phsThumbnailLandscapeCover,
                            { scaleX: 0 },
                            {
                                scaleX: 1,
                                duration: 0.65,
                                delay: phsThumbnailLandscapeDelay,
                                transformOrigin: "right center",
                                ease: "power1.in",
                            },
                        )
                        .set(phsThumbnailLandscapeImg, { opacity: 1 })
                        .fromTo(
                            phsThumbnailLandscapeCover,
                            { scaleX: 1 },
                            {
                                scaleX: 0,
                                duration: 0.65,
                                delay: 0.1,
                                transformOrigin: "left center",
                                ease: "power1.out",
                            },
                        );
            }
            let phsThumbnailPortraitImg = $(
                    ".sk__project-header .sk__project-thumbnail-portrait-col img",
                ),
                phsThumbnailPortraitCover = $(
                    ".sk__project-header .sk__project-thumbnail-portrait-cover",
                );
            if (
                phsThumbnailPortraitImg.length &&
                phsThumbnailPortraitCover.length
            ) {
                let phsThumbnailPortraitDelay = 0.5 + projectHeaderDelay,
                    phsThumbnailPortrait = gsap
                        .timeline()
                        .set(phsThumbnailPortraitCover, { scaleY: 0 })
                        .fromTo(
                            phsThumbnailPortraitCover,
                            { scaleY: 0 },
                            {
                                scaleY: 1,
                                duration: 0.65,
                                delay: phsThumbnailPortraitDelay,
                                transformOrigin: "center top",
                                ease: "power1.in",
                            },
                        )
                        .set(phsThumbnailPortraitImg, { opacity: 1 })
                        .fromTo(
                            phsThumbnailPortraitCover,
                            { scaleY: 1 },
                            {
                                scaleY: 0,
                                duration: 0.65,
                                delay: 0.1,
                                transformOrigin: "center bottom",
                                ease: "power1.out",
                            },
                        );
            }
        }
    }
    let projectBodyImgColumn = $(".sk__project-body-image-col"),
        projectBodyImg = $(".sk__project-body-image-col img");
    projectBodyImg.length &&
        projectBodyImgColumn.length &&
        gsap.fromTo(
            projectBodyImg,
            { opacity: 0, xPercent: 100 },
            {
                opacity: 1,
                xPercent: 0,
                ease: "power1.out",
                duration: 1,
                delay: 0.2,
                scrollTrigger: {
                    trigger: projectBodyImgColumn,
                    start: "top 50%",
                },
                stagger: 0.08,
            },
        );
    let projectBodyInfo = $(".sk__project-body-info-col"),
        projectBodyInfoElements = $(
            ".sk__project-body-info-col .animated-element",
        );
    projectBodyInfo.length &&
        projectBodyInfoElements.length &&
        gsap.fromTo(
            projectBodyInfoElements,
            { opacity: 0, x: -40 },
            {
                opacity: 1,
                x: 0,
                ease: "power1.out",
                scrollTrigger: { trigger: projectBodyInfo, start: "top 50%" },
                stagger: 0.08,
            },
        );
    let contactMainSection = $(".sk__contact-page #contact-us");
    contactMainSection.length &&
        gsap.to(contactMainSection, {
            opacity: 1,
            duration: 0.6,
            ease: "power1.out",
            delay: 1.2,
        });
    let mainMenuMobileLogo = $(".sk__mobile-main-logo");
    mainMenuMobileLogo.length &&
        gsap.to(mainMenuMobileLogo, {
            opacity: 1,
            duration: 0.6,
            ease: "power1.out",
            delay: 0.15,
        });
    let mainMenuDesktopLogo = $(".navbar-brand");
    mainMenuDesktopLogo.length &&
        gsap.to(mainMenuDesktopLogo, {
            opacity: 1,
            duration: 0.6,
            ease: "power1.out",
            delay: 0.15,
        });
    let mainMenuBar = $(".sk__mobile-menu-bar");
    mainMenuBar.length &&
        gsap.to(mainMenuBar, {
            opacity: 1,
            duration: 0.6,
            ease: "power1.out",
            delay: 0.3,
        });
    let countrySwitcherWrap = $(".sk__country-switcher-wrap");
    countrySwitcherWrap.length &&
        gsap.to(countrySwitcherWrap, {
            opacity: 1,
            duration: 0.6,
            ease: "power1.out",
            delay: 0.3,
        });
    let mainMenuTrigger = $(".hc-nav-trigger");
    mainMenuTrigger.length &&
        gsap.to(mainMenuTrigger, {
            opacity: 1,
            duration: 0.6,
            ease: "power1.out",
            delay: 0.15,
        });
    let generalHeaderSection = $("section.sk__animated-header");
    if (generalHeaderSection.length) {
        let delayTime = 0.7,
            durationTime = 0.6;
        gsap.to(generalHeaderSection, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power1.out",
            delay: delayTime,
            onComplete: parallaxHeader,
        });
    } else parallaxHeader();
    let bodySection = $(".sk__body-section");
    bodySection.length &&
        gsap.to(bodySection, {
            delay: 1.2,
            opacity: 1,
            duration: 0.6,
            ease: "power1.out",
        });
    var parallaxBackgroundsSelector = ".sk__parallax-background-section";
    (isMobile == !0 &&
        ($(".carousel-item .sk__parallax-background-section").addClass(
            "sk__skip-parallax-background-section",
        ),
        $(".carousel-item .sk__skip-parallax-background-section").removeClass(
            "sk__parallax-background-section",
        )),
        gsap.utils
            .toArray(".sk__parallax-background-section")
            .forEach((section, i) => {
                if (
                    ((section.bg = section.querySelector(
                        ".sk__parallax-background-element",
                    )),
                    !section.bg)
                )
                    return;
                function originX() {
                    let parallaxBackgroundOriginX2 =
                        section.bg.dataset.skOriginX;
                    return (
                        parallaxBackgroundOriginX2 == "left"
                            ? (parallaxBackgroundOriginX2 = "left")
                            : parallaxBackgroundOriginX2 == "right"
                              ? (parallaxBackgroundOriginX2 = "right")
                              : (parallaxBackgroundOriginX2 == "center",
                                (parallaxBackgroundOriginX2 = "50%")),
                        parallaxBackgroundOriginX2
                    );
                }
                i
                    ? ((parallaxBackgroundOriginX = originX()),
                      (section.bg.style.backgroundPosition = `${parallaxBackgroundOriginX} ${innerHeight / 2}px`),
                      gsap.to(section.bg, {
                          backgroundPosition: `${parallaxBackgroundOriginX} ${-innerHeight / 2}`,
                          ease: "none",
                          scrollTrigger: {
                              trigger: section,
                              scrub: !0,
                              onUpdate: function (self) {
                                  gsap.set(section.bg, {
                                      top:
                                          self.scroll() -
                                          section.bg.parentElement.offsetTop,
                                  });
                              },
                          },
                      }))
                    : ((parallaxBackgroundOriginX = originX()),
                      (section.bg.style.backgroundPosition = `${parallaxBackgroundOriginX} 0px`),
                      gsap.to(section.bg, {
                          backgroundPosition: `${parallaxBackgroundOriginX} ${-innerHeight / 2}px`,
                          ease: "none",
                          scrollTrigger: {
                              trigger: section,
                              start: "top top",
                              scrub: !0,
                              onUpdate: function (self) {
                                  gsap.set(section.bg, {
                                      top:
                                          self.scroll() -
                                          section.bg.parentElement.offsetTop,
                                  });
                              },
                          },
                      }));
            }),
        $(
            ".sk__hero-section .carousel-item .sk__video-background-section",
        ).each(function () {
            let parallaxHeroVideoTrigger = $(this),
                parallaxHeroVideo = $(this).find(".sk__parallax-hero-video");
            parallaxHeroVideo.length &&
                parallaxHeroVideoTrigger.length &&
                gsap.fromTo(
                    parallaxHeroVideo,
                    { yPercent: 0 },
                    {
                        yPercent: 60,
                        ease: "none",
                        scrollTrigger: {
                            trigger: parallaxHeroVideoTrigger,
                            start: "top top",
                            end: "bottom top",
                            scrub: !0,
                        },
                    },
                );
        }),
        massFadeIn(
            ".static-simple-footer",
            ".footer-bottom > *",
            0.2,
            "[0,0]",
            2.3,
            1,
        ),
        $(".fancy-gradient-text-box:not(.reveal-onscroll)").each(function () {
            $(this).length &&
                revealText(
                    ".fancy-gradient-text-box:not(.reveal-onscroll)",
                    0.4,
                    0.8,
                );
        }),
        $(this).length &&
            scrollRevealText(
                ".fancy-gradient-text-box.reveal-onscroll",
                0.4,
                0,
                0,
                "bottom",
                !1,
                "top 95%",
                "top 30%",
                "play complete",
            ),
        $(".sk__solid-menu-bar").each(function () {
            var section = $(this);
            if (section.length) {
                let sectionTL = gsap.timeline({
                    scrollTrigger: {
                        trigger: section,
                        start: "top 100px",
                        end: "bottom 110px",
                        toggleClass: {
                            targets: "body",
                            className: "sk__solid-menu",
                        },
                    },
                });
            }
        }));
    let backToTopSection = $(".sk__back-to-top-wrap");
    if (
        (backToTopSection.length &&
            gsap.to(backToTopSection, {
                scrollTrigger: {
                    trigger: "body",
                    start: "top -90%",
                    toggleClass: {
                        targets: backToTopSection,
                        className: "sk__backtotop-visible",
                    },
                    scrub: !0,
                },
            }),
        isMobile != !0)
    ) {
        var parallaxLayersSceneRings = document.getElementById(
            "sk__parallax-layers-1",
        );
        if (parallaxLayersSceneRings)
            var parallaxLayersInstanceRings = new Parallax(
                parallaxLayersSceneRings,
            );
        var parallaxLayersAbout = document.querySelectorAll(
            ".sk__rectangles-left-parallax-layers",
        );
        parallaxLayersAbout.length &&
            parallaxLayersAbout.forEach(function (element) {
                new Parallax(element);
            });
        var parallaxLayersSceneFeaturedProject = document.getElementById(
            "sk__parallax-layers-featured-project",
        );
        if (parallaxLayersSceneFeaturedProject)
            var parallaxLayersInstanceFeaturedProject = new Parallax(
                parallaxLayersSceneFeaturedProject,
            );
        var parallaxLayersSceneLaptop = document.getElementById(
            "sk__parallax-layers-laptop",
        );
        if (parallaxLayersSceneLaptop)
            var parallaxLayersInstanceLaptop = new Parallax(
                parallaxLayersSceneLaptop,
            );
        var parallaxLayersSceneTextRight = document.getElementById(
            "sk__parallax-layers-text-right",
        );
        if (parallaxLayersSceneTextRight)
            var parallaxLayersInstanceTextRight = new Parallax(
                parallaxLayersSceneTextRight,
            );
    }
    $(".sk__portfolio-wrapper:not(.not-slick)")
        .slick({
            dots: !0,
            infinite: !1,
            speed: 1200,
            slidesToShow: 5,
            slidesToScroll: 3,
            autoplay: !0,
            autoplaySpeed: 6e3,
            responsive: [
                {
                    breakpoint: 1920,
                    settings: {
                        slidesToShow: 5,
                        slidesToScroll: 3,
                        infinite: !0,
                        dots: !0,
                    },
                },
                {
                    breakpoint: 1280,
                    settings: {
                        slidesToShow: 4,
                        slidesToScroll: 3,
                        infinite: !0,
                        dots: !0,
                    },
                },
                {
                    breakpoint: 1024,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 3,
                        infinite: !0,
                        dots: !0,
                    },
                },
                {
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 3,
                        arrows: !1,
                    },
                },
                {
                    breakpoint: 680,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 2,
                        arrows: !1,
                    },
                },
            ],
        })
        .slick("slickPause");
    function playSlickPortfolio() {
        $(".sk__portfolio-wrapper:not(.not-slick)").slick("slickPlay");
    }
    let slickPortfolio = $(".sk__portfolio-wrapper:not(.not-slick)");
    slickPortfolio.length &&
        ScrollTrigger.create({
            trigger: slickPortfolio,
            onEnter: playSlickPortfolio,
        });
    let heroMegaText = $(".h1-hero-mega-text");
    if (heroMegaText.length) {
        let megaTextDelayMS = (effectsMasterDelay - 1.1) * 1e3;
        (megaTextDelayMS < 0 && (megaTextDelayMS = 0),
            setTimeout(function () {
                $(heroMegaText).removeClass("unspaced");
            }, megaTextDelayMS),
            setTimeout(function () {
                $(heroMegaText).css("color", "#f9bd93");
            }, megaTextDelayMS + 1800));
    }
    ((window.onload = () => {
        function getSamePageAnchor(link) {
            return link.protocol !== window.location.protocol ||
                link.host !== window.location.host ||
                link.pathname !== window.location.pathname ||
                link.search !== window.location.search
                ? !1
                : link.hash;
        }
        function scrollToHash(hash, e) {
            const elem = hash ? document.querySelector(hash) : !1;
            elem && (e && e.preventDefault(), smoother.scrollTo(elem, !0));
        }
        (document.querySelectorAll('a[href]:not([href="#"])').forEach((a) => {
            a.addEventListener("click", (e) => {
                scrollToHash(getSamePageAnchor(a), e);
            });
        }),
            scrollToHash(window.location.hash),
            equalizeHeroBoxesHeights(),
            alignSocialsWithHeading(),
            hugeDecorativeVerticalTexts(),
            warpedText(),
            warpedTextAlign(),
            iconboxCloneIcons());
    }),
        dispatchResizeExceptOn("sk__has-youtube-video"),
        window.scrollTo(window.scrollX, window.scrollY - 1),
        window.scrollTo(window.scrollX, window.scrollY + 1),
        window.addEventListener("resize", function () {
            ((screenRatio = getScreenRatio()),
                equalizeHeroBoxesHeights(),
                manageRingsSection(),
                alignSocialsWithHeading(),
                hugeDecorativeVerticalTexts(),
                warpedTextAlign());
        }),
        $("a.demo-turn-on-pattern-overlay").on("click", function (event2) {
            (event2.preventDefault(),
                $(this)
                    .parentsUntil("section")
                    .find(".sk__pattern-overlay")
                    .toggleClass("d-block d-none"));
        }),
        $("a.demo-turn-on-gradient-overlay").on("click", function (event2) {
            (event2.preventDefault(),
                $(this)
                    .parentsUntil("section")
                    .find(".sk__gradient-back-v1")
                    .toggleClass("d-block d-none"));
        }));
    let themePreviewHero = $(".tp-hero"),
        themePreviewHeroThumbsColumn = $(".tp-thumbs"),
        themePreviewHeroThumbs = $('.tp-thumbs div[class*="tp-thumb-"]');
    (themePreviewHeroThumbsColumn.length &&
        themePreviewHeroThumbs.length &&
        $(themePreviewHeroThumbs).each(function (i) {
            let elem = $(this),
                theDuration = 0.8,
                delayOne = 1 + i * 0.05,
                delayTwo = theDuration + delayOne;
            (gsap.to(elem, {
                scale: 0.9,
                opacity: 1,
                duration: theDuration,
                delay: delayOne,
                ease: "power3.inOut",
            }),
                gsap.to(elem, {
                    scale: 1,
                    duration: 5,
                    delay: delayTwo,
                    ease: "power1.out",
                }));
        }),
        themePreviewHero.length &&
            themePreviewHeroThumbs.length &&
            (gsap.to(".tp-hero > div:not(.sk__parallax-header-image)", {
                y: 430,
                opacity: 0,
                scrollTrigger: {
                    trigger: "body",
                    start: "top top-=10px",
                    end: "top top-=100%",
                    scrub: !0,
                },
            }),
            gsap.to(".tp-hero .sk__parallax-header-image", {
                y: 430,
                scrollTrigger: {
                    trigger: "body",
                    start: "top top-=10px",
                    end: "top top-=100%",
                    scrub: !0,
                },
            })),
        revealText(".tp-hero h1", 0.7, 0.95, !1, "bottom"),
        revealText(".tp-hero h2", 0.7, 1.6, !1, "top"),
        revealText(".tp-hero p", 0.7, 2, !1, "top"),
        revealText(".sk__icons-presentation-section h1", 0.4, 0.4),
        revealText(".sk__icons-presentation-section h2", 0.4, 0.6, 0.3, "top"),
        massFadeIn(
            ".sk__icons-presentation-icons",
            ".sk__icons-presentation-icons > *",
            0.03,
            "[0,0]",
            1.4,
        ),
        massFadeIn(
            ".gsap-features",
            ".gsap-features .img-feature-wrap",
            0.1,
            "[0,0]",
        ),
        massFadeIn(
            ".sk__elements-typography-col",
            ".sk__elements-typography-col > *",
            0.03,
            "[0,0]",
            1.4,
        ),
        $(".sk__imagebox").each(function (i) {
            let element = $(this);
            element.length &&
                gsap.fromTo(
                    element,
                    { opacity: 0, x: -20 },
                    {
                        opacity: 1,
                        x: 0,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: element,
                            start: "top 80%",
                            end: "top 30%",
                            toggleActions: "play complete",
                            scrub: !1,
                        },
                        duration: 1,
                    },
                );
        }));
});
