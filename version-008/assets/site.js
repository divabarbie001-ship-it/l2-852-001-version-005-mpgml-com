(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function initMenu() {
        var button = document.querySelector(".menu-toggle");
        var menu = document.querySelector(".mobile-nav");
        if (!button || !menu) {
            return;
        }
        button.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function initHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
        var prev = hero.querySelector(".hero-control.prev");
        var next = hero.querySelector(".hero-control.next");
        var index = 0;
        var timer;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        }

        function play() {
            clearInterval(timer);
            timer = setInterval(function () {
                show(index + 1);
            }, 5000);
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                play();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                play();
            });
        }
        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener("click", function () {
                show(dotIndex);
                play();
            });
        });
        show(0);
        play();
    }

    function optionList(cards, key) {
        var values = [];
        cards.forEach(function (card) {
            var value = card.getAttribute(key) || "";
            if (value && values.indexOf(value) === -1) {
                values.push(value);
            }
        });
        values.sort(function (a, b) {
            return String(b).localeCompare(String(a), "zh-CN");
        });
        return values;
    }

    function fillSelect(select, values) {
        if (!select) {
            return;
        }
        values.forEach(function (value) {
            var option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
    }

    function initFilters() {
        var panel = document.querySelector(".filter-panel");
        if (!panel) {
            return;
        }
        var cards = Array.prototype.slice.call(document.querySelectorAll(".searchable-card"));
        var input = panel.querySelector(".filter-input");
        var region = panel.querySelector(".filter-region");
        var type = panel.querySelector(".filter-type");
        var year = panel.querySelector(".filter-year");
        var reset = panel.querySelector(".filter-reset");
        var params = new URLSearchParams(window.location.search);

        fillSelect(region, optionList(cards, "data-region"));
        fillSelect(type, optionList(cards, "data-type"));
        fillSelect(year, optionList(cards, "data-year"));

        if (input && params.get("q")) {
            input.value = params.get("q");
        }

        function apply() {
            var q = normalize(input && input.value);
            var r = region ? region.value : "";
            var t = type ? type.value : "";
            var y = year ? year.value : "";
            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute("data-title"),
                    card.getAttribute("data-region"),
                    card.getAttribute("data-type"),
                    card.getAttribute("data-year"),
                    card.getAttribute("data-tags"),
                    card.getAttribute("data-genre")
                ].join(" "));
                var matched = true;
                if (q && haystack.indexOf(q) === -1) {
                    matched = false;
                }
                if (r && card.getAttribute("data-region") !== r) {
                    matched = false;
                }
                if (t && card.getAttribute("data-type") !== t) {
                    matched = false;
                }
                if (y && card.getAttribute("data-year") !== y) {
                    matched = false;
                }
                card.classList.toggle("is-filter-hidden", !matched);
            });
        }

        [input, region, type, year].forEach(function (el) {
            if (el) {
                el.addEventListener("input", apply);
                el.addEventListener("change", apply);
            }
        });
        if (reset) {
            reset.addEventListener("click", function () {
                if (input) {
                    input.value = "";
                }
                if (region) {
                    region.value = "";
                }
                if (type) {
                    type.value = "";
                }
                if (year) {
                    year.value = "";
                }
                apply();
            });
        }
        apply();
    }

    window.setupMoviePlayer = function (streamUrl) {
        var video = document.getElementById("movie-player");
        var cover = document.querySelector(".player-cover");
        if (!video || !streamUrl) {
            return;
        }
        var hlsInstance = null;
        var attached = false;

        function attach() {
            if (attached) {
                return;
            }
            attached = true;
            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(streamUrl);
                hlsInstance.attachMedia(video);
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = streamUrl;
            } else {
                video.src = streamUrl;
            }
        }

        function start() {
            attach();
            if (cover) {
                cover.classList.add("is-hidden");
            }
            var playResult = video.play();
            if (playResult && typeof playResult.catch === "function") {
                playResult.catch(function () {
                    if (cover) {
                        cover.classList.remove("is-hidden");
                    }
                });
            }
        }

        if (cover) {
            cover.addEventListener("click", start);
        }
        video.addEventListener("play", function () {
            if (cover) {
                cover.classList.add("is-hidden");
            }
        });
        video.addEventListener("pause", function () {
            if (!video.ended && video.currentTime === 0 && cover) {
                cover.classList.remove("is-hidden");
            }
        });
        window.addEventListener("pagehide", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    };

    ready(function () {
        initMenu();
        initHero();
        initFilters();
    });
})();
