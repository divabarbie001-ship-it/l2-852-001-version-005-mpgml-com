(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function initMobileMenu() {
        var button = qs('.mobile-menu-button');
        var menu = qs('.mobile-nav');
        if (!button || !menu) {
            return;
        }
        button.addEventListener('click', function () {
            var opened = menu.classList.toggle('is-open');
            button.setAttribute('aria-expanded', opened ? 'true' : 'false');
        });
    }

    function initHeroSlider() {
        var slider = qs('[data-hero-slider]');
        if (!slider) {
            return;
        }
        var slides = qsa('.hero-slide', slider);
        var dots = qsa('.hero-dot', slider);
        if (!slides.length) {
            return;
        }
        var index = 0;
        var timer = null;
        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === index);
            });
        }
        function play() {
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }
        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                window.clearInterval(timer);
                show(i);
                play();
            });
        });
        play();
    }

    function initFilters() {
        var panel = qs('[data-filter-panel]');
        var list = qs('[data-card-list]');
        if (!panel || !list) {
            return;
        }
        var cards = qsa('.movie-card', list);
        var keyword = qs('[data-filter-keyword]', panel);
        var fields = qsa('[data-filter-field]', panel);
        var empty = qs('[data-empty-state]');
        function apply() {
            var words = (keyword ? keyword.value : '').trim().toLowerCase();
            var active = {};
            fields.forEach(function (field) {
                active[field.getAttribute('data-filter-field')] = field.value;
            });
            var shown = 0;
            cards.forEach(function (card) {
                var content = [
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-tags')
                ].join(' ').toLowerCase();
                var ok = !words || content.indexOf(words) !== -1;
                Object.keys(active).forEach(function (key) {
                    if (active[key] && card.getAttribute('data-' + key) !== active[key]) {
                        ok = false;
                    }
                });
                card.hidden = !ok;
                if (ok) {
                    shown += 1;
                }
            });
            if (empty) {
                empty.hidden = shown !== 0;
            }
        }
        if (keyword) {
            keyword.addEventListener('input', apply);
        }
        fields.forEach(function (field) {
            field.addEventListener('change', apply);
        });
    }

    function movieCard(item) {
        var text = item.title + ' ' + item.region + ' ' + item.type + ' ' + item.year + ' ' + item.genre + ' ' + item.tags;
        return '<article class="movie-card" data-search="' + escapeHtml(text.toLowerCase()) + '">' +
            '<a class="card-cover" href="./' + item.href + '">' +
            '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
            '<span class="play-badge">▶</span><span class="card-tag">' + escapeHtml(item.type) + '</span>' +
            '</a>' +
            '<div class="card-body">' +
            '<a class="card-title" href="./' + item.href + '">' + escapeHtml(item.title) + '</a>' +
            '<p class="card-meta">' + escapeHtml(item.year + ' · ' + item.region + ' · ' + item.type) + '</p>' +
            '<p class="card-summary">' + escapeHtml(item.one_line) + '</p>' +
            '</div>' +
            '</article>';
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (ch) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[ch];
        });
    }

    function initSearch() {
        var data = window.SEARCH_MOVIES;
        if (!data || !data.length) {
            return;
        }
        var input = qs('#searchInput');
        var type = qs('#searchType');
        var region = qs('#searchRegion');
        var button = qs('#searchButton');
        var results = qs('#searchResults');
        var empty = qs('#searchEmpty');
        if (!input || !type || !region || !button || !results) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var initial = params.get('q') || '';
        var types = Array.from(new Set(data.map(function (item) { return item.type; }).filter(Boolean))).sort();
        var regions = Array.from(new Set(data.map(function (item) { return item.region; }).filter(Boolean))).sort();
        types.forEach(function (value) {
            type.insertAdjacentHTML('beforeend', '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>');
        });
        regions.forEach(function (value) {
            region.insertAdjacentHTML('beforeend', '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>');
        });
        input.value = initial;
        function run() {
            var q = input.value.trim().toLowerCase();
            var typeValue = type.value;
            var regionValue = region.value;
            var list = data.filter(function (item) {
                var haystack = [item.title, item.region, item.type, item.year, item.genre, item.tags, item.one_line].join(' ').toLowerCase();
                return (!q || haystack.indexOf(q) !== -1) && (!typeValue || item.type === typeValue) && (!regionValue || item.region === regionValue);
            }).slice(0, 160);
            results.innerHTML = list.map(movieCard).join('');
            if (empty) {
                empty.hidden = list.length !== 0;
            }
        }
        button.addEventListener('click', run);
        input.addEventListener('input', run);
        type.addEventListener('change', run);
        region.addEventListener('change', run);
        run();
    }

    document.addEventListener('DOMContentLoaded', function () {
        initMobileMenu();
        initHeroSlider();
        initFilters();
        initSearch();
    });
}());
