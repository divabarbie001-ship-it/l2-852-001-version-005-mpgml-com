(function () {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    function initNavigation() {
        var toggle = document.querySelector("[data-nav-toggle]");
        var nav = document.querySelector("[data-mobile-nav]");
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener("click", function () {
            nav.classList.toggle("open");
        });
    }

    function initHero() {
        var root = document.querySelector("[data-hero]");
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
        var prev = root.querySelector("[data-hero-prev]");
        var next = root.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function setActive(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("active", slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("active", dotIndex === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                setActive(index + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                setActive(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });
        if (prev) {
            prev.addEventListener("click", function () {
                setActive(index - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                setActive(index + 1);
                start();
            });
        }
        root.addEventListener("mouseenter", stop);
        root.addEventListener("mouseleave", start);
        setActive(0);
        start();
    }

    function initScrollRows() {
        document.querySelectorAll("[data-scroll-target]").forEach(function (button) {
            button.addEventListener("click", function () {
                var name = button.getAttribute("data-scroll-target");
                var dir = button.getAttribute("data-scroll-dir") === "left" ? -1 : 1;
                var row = document.querySelector('[data-scroll-row="' + name + '"]');
                if (row) {
                    row.scrollBy({ left: dir * 340, behavior: "smooth" });
                }
            });
        });
    }

    function initFilters() {
        document.querySelectorAll("[data-card-filter-scope]").forEach(function (scope) {
            var input = scope.querySelector(".js-search");
            var buttons = Array.prototype.slice.call(scope.querySelectorAll(".filter-btn"));
            var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card, .rank-item"));
            var empty = scope.querySelector("[data-empty-state]");
            var currentFilter = "all";

            function matchesFilter(card) {
                if (currentFilter === "all") {
                    return true;
                }
                var bucket = [
                    card.getAttribute("data-year") || "",
                    card.getAttribute("data-category") || "",
                    card.getAttribute("data-region") || "",
                    card.getAttribute("data-type") || ""
                ].join(" ");
                return bucket.indexOf(currentFilter) !== -1;
            }

            function apply() {
                var q = input ? input.value.trim().toLowerCase() : "";
                var visible = 0;
                cards.forEach(function (card) {
                    var search = (card.getAttribute("data-search") || card.textContent || "").toLowerCase();
                    var ok = (!q || search.indexOf(q) !== -1) && matchesFilter(card);
                    card.hidden = !ok;
                    if (ok) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.hidden = visible !== 0;
                }
            }

            if (input) {
                input.addEventListener("input", apply);
                var params = new URLSearchParams(window.location.search);
                var q = params.get("q");
                if (q) {
                    input.value = q;
                }
            }
            buttons.forEach(function (button) {
                button.addEventListener("click", function () {
                    buttons.forEach(function (item) {
                        item.classList.remove("active");
                    });
                    button.classList.add("active");
                    currentFilter = button.getAttribute("data-filter") || "all";
                    apply();
                });
            });
            apply();
        });
    }

    function initPlayer() {
        var card = document.querySelector("[data-player]");
        if (!card) {
            return;
        }
        var video = card.querySelector("video");
        var cover = card.querySelector("[data-player-cover]");
        if (!video) {
            return;
        }
        var stream = video.getAttribute("data-stream") || "";
        var initialized = false;

        function prepare() {
            if (initialized || !stream) {
                return;
            }
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = stream;
            } else if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({ enableWorker: true });
                hls.loadSource(stream);
                hls.attachMedia(video);
                video.hlsInstance = hls;
            } else {
                video.src = stream;
            }
            initialized = true;
        }

        function play() {
            prepare();
            if (cover) {
                cover.classList.add("is-hidden");
            }
            var result = video.play();
            if (result && typeof result.catch === "function") {
                result.catch(function () {});
            }
        }

        if (cover) {
            cover.addEventListener("click", play);
        }
        video.addEventListener("play", function () {
            if (cover) {
                cover.classList.add("is-hidden");
            }
        });
        video.addEventListener("click", function () {
            if (!initialized) {
                play();
            }
        });
    }

    ready(function () {
        initNavigation();
        initHero();
        initScrollRows();
        initFilters();
        initPlayer();
    });
})();
