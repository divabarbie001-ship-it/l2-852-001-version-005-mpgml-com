(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var navLinks = document.querySelector('[data-nav-links]');

    if (menuButton && navLinks) {
        menuButton.addEventListener('click', function () {
            navLinks.classList.toggle('is-open');
        });
    }

    document.querySelectorAll('[data-hero-slider]').forEach(function (slider) {
        var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
        var prev = slider.querySelector('[data-hero-prev]');
        var next = slider.querySelector('[data-hero-next]');
        var current = 0;
        var timer = null;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }

            current = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        function startTimer() {
            stopTimer();
            timer = window.setInterval(function () {
                showSlide(current + 1);
            }, 5200);
        }

        function stopTimer() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
                startTimer();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                showSlide(current - 1);
                startTimer();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                showSlide(current + 1);
                startTimer();
            });
        }

        slider.addEventListener('mouseenter', stopTimer);
        slider.addEventListener('mouseleave', startTimer);
        showSlide(0);
        startTimer();
    });

    document.querySelectorAll('[data-search-scope]').forEach(function (scope) {
        var searchInput = scope.querySelector('[data-site-search]');
        var regionInput = scope.querySelector('[data-filter-region]');
        var typeInput = scope.querySelector('[data-filter-type]');
        var yearInput = scope.querySelector('[data-filter-year]');
        var categoryInput = scope.querySelector('[data-filter-category]');
        var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));
        var emptyState = scope.querySelector('[data-empty-state]');

        function normalize(value) {
            return String(value || '').toLowerCase().trim();
        }

        function cardText(card) {
            return normalize([
                card.getAttribute('data-title'),
                card.getAttribute('data-region'),
                card.getAttribute('data-type'),
                card.getAttribute('data-year'),
                card.getAttribute('data-category'),
                card.getAttribute('data-tags'),
                card.getAttribute('data-keywords')
            ].join(' '));
        }

        function applyFilters() {
            var query = normalize(searchInput ? searchInput.value : '');
            var region = normalize(regionInput ? regionInput.value : '');
            var type = normalize(typeInput ? typeInput.value : '');
            var year = normalize(yearInput ? yearInput.value : '');
            var category = normalize(categoryInput ? categoryInput.value : '');
            var visibleCount = 0;

            cards.forEach(function (card) {
                var text = cardText(card);
                var matches = true;

                if (query && text.indexOf(query) === -1) {
                    matches = false;
                }

                if (region && normalize(card.getAttribute('data-region')).indexOf(region) === -1) {
                    matches = false;
                }

                if (type && normalize(card.getAttribute('data-type')).indexOf(type) === -1) {
                    matches = false;
                }

                if (year && normalize(card.getAttribute('data-year')).indexOf(year) === -1) {
                    matches = false;
                }

                if (category && normalize(card.getAttribute('data-category')) !== category) {
                    matches = false;
                }

                card.hidden = !matches;
                if (matches) {
                    visibleCount += 1;
                }
            });

            if (emptyState) {
                emptyState.hidden = visibleCount !== 0;
            }
        }

        [searchInput, regionInput, typeInput, yearInput, categoryInput].forEach(function (field) {
            if (field) {
                field.addEventListener('input', applyFilters);
                field.addEventListener('change', applyFilters);
            }
        });

        applyFilters();
    });

    document.querySelectorAll('.player-shell[data-hls]').forEach(function (player) {
        var video = player.querySelector('video');
        var button = player.querySelector('.play-overlay');
        var source = player.getAttribute('data-hls');
        var initialized = false;
        var hlsInstance = null;

        function initializeVideo() {
            if (initialized || !video || !source) {
                return;
            }

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                initialized = true;
                return;
            }

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);
                initialized = true;
                return;
            }

            video.src = source;
            initialized = true;
        }

        function startPlayback() {
            initializeVideo();

            if (!video) {
                return;
            }

            player.classList.add('is-playing');
            var playback = video.play();

            if (playback && typeof playback.catch === 'function') {
                playback.catch(function () {
                    player.classList.remove('is-playing');
                });
            }
        }

        if (button) {
            button.addEventListener('click', startPlayback);
        }

        if (video) {
            video.addEventListener('click', function () {
                if (video.paused) {
                    startPlayback();
                }
            });

            video.addEventListener('play', function () {
                player.classList.add('is-playing');
            });

            video.addEventListener('pause', function () {
                if (video.currentTime === 0 || video.ended) {
                    player.classList.remove('is-playing');
                }
            });

            video.addEventListener('ended', function () {
                player.classList.remove('is-playing');
            });
        }

        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });
})();
