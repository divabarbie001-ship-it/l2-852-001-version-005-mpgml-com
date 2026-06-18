(function () {
  'use strict';

  const root = document.body ? document.body.dataset.root || '.' : '.';

  function withRoot(path) {
    if (!path) {
      return '#';
    }
    if (/^(https?:)?\/\//.test(path) || path.startsWith('#')) {
      return path;
    }
    return root === '.' ? path : root.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function debounce(fn, wait) {
    let timer = 0;
    return function debounced() {
      const context = this;
      const args = arguments;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        fn.apply(context, args);
      }, wait);
    };
  }

  function setupImages() {
    document.querySelectorAll('img[data-fallback]').forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) {
        img.classList.add('is-missing');
      }
      img.addEventListener('error', function () {
        img.classList.add('is-missing');
      });
    });
  }

  function setupMobileNav() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const panel = document.querySelector('[data-mobile-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function renderSearchResults(panel, items) {
    if (!panel) {
      return;
    }
    if (!items.length) {
      panel.innerHTML = '<div class="search-empty">没有找到匹配影片</div>';
      panel.classList.add('is-open');
      return;
    }
    panel.innerHTML = items.map(function (movie) {
      const title = movie.title || '';
      const meta = [movie.region, movie.type, movie.year].filter(Boolean).join(' · ');
      const cover = withRoot(movie.cover || '1.jpg');
      const url = withRoot(movie.url);
      return [
        '<a class="search-result" href="' + url + '">',
        '  <span class="search-thumb">',
        '    <span class="search-thumb-fallback" aria-hidden="true"></span>',
        '    <img src="' + cover + '" alt="' + escapeHtml(title) + '" loading="lazy" data-fallback>',
        '  </span>',
        '  <span>',
        '    <h4>' + escapeHtml(title) + '</h4>',
        '    <p>' + escapeHtml(meta) + '</p>',
        '  </span>',
        '</a>'
      ].join('');
    }).join('');
    panel.classList.add('is-open');
    setupImages();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setupGlobalSearch() {
    const data = Array.isArray(window.MOVIES_DATA) ? window.MOVIES_DATA : [];
    document.querySelectorAll('[data-global-search-form]').forEach(function (form) {
      const input = form.querySelector('[data-global-search]');
      const panel = form.querySelector('[data-search-results]');
      if (!input || !panel) {
        return;
      }

      const runSearch = debounce(function () {
        const query = normalize(input.value);
        if (!query) {
          panel.classList.remove('is-open');
          panel.innerHTML = '';
          return;
        }
        const terms = query.split(/\s+/).filter(Boolean);
        const matches = data.filter(function (movie) {
          const haystack = normalize([
            movie.title,
            movie.region,
            movie.type,
            movie.year,
            movie.genre,
            movie.tags,
            movie.oneLine
          ].join(' '));
          return terms.every(function (term) {
            return haystack.indexOf(term) !== -1;
          });
        }).slice(0, 12);
        renderSearchResults(panel, matches);
      }, 120);

      input.addEventListener('input', runSearch);
      input.addEventListener('focus', runSearch);
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        const first = panel.querySelector('a.search-result');
        if (first) {
          window.location.href = first.href;
        }
      });
    });

    document.addEventListener('click', function (event) {
      document.querySelectorAll('[data-global-search-form]').forEach(function (form) {
        if (!form.contains(event.target)) {
          const panel = form.querySelector('[data-search-results]');
          if (panel) {
            panel.classList.remove('is-open');
          }
        }
      });
    });
  }

  function setupLocalFilters() {
    const cards = Array.from(document.querySelectorAll('[data-filter-card]'));
    if (!cards.length) {
      return;
    }
    const input = document.querySelector('[data-filter-input]');
    const type = document.querySelector('[data-filter-type]');
    const region = document.querySelector('[data-filter-region]');
    const year = document.querySelector('[data-filter-year]');
    const count = document.querySelector('[data-filter-count]');

    function cardText(card) {
      return normalize([
        card.dataset.title,
        card.dataset.type,
        card.dataset.region,
        card.dataset.year,
        card.dataset.genre,
        card.dataset.tags
      ].join(' '));
    }

    function applyFilter() {
      const q = normalize(input ? input.value : '');
      const qTerms = q.split(/\s+/).filter(Boolean);
      const typeValue = normalize(type ? type.value : '');
      const regionValue = normalize(region ? region.value : '');
      const yearValue = normalize(year ? year.value : '');
      let visible = 0;

      cards.forEach(function (card) {
        const text = cardText(card);
        const okQuery = qTerms.every(function (term) {
          return text.indexOf(term) !== -1;
        });
        const okType = !typeValue || normalize(card.dataset.type).indexOf(typeValue) !== -1;
        const okRegion = !regionValue || normalize(card.dataset.region).indexOf(regionValue) !== -1;
        const okYear = !yearValue || normalize(card.dataset.year) === yearValue;
        const ok = okQuery && okType && okRegion && okYear;
        card.classList.toggle('is-hidden', !ok);
        if (ok) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = '当前显示 ' + visible + ' / ' + cards.length + ' 部影片';
      }
    }

    [input, type, region, year].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });
    applyFilter();
  }

  function setupPlayers() {
    document.querySelectorAll('[data-player]').forEach(function (player) {
      const video = player.querySelector('video[data-src]');
      const cover = player.querySelector('.player-cover');
      if (!video || !cover) {
        return;
      }

      let hlsInstance = null;

      function start() {
        const source = video.dataset.src;
        if (!source) {
          return;
        }
        cover.classList.add('is-hidden');
        if (window.Hls && window.Hls.isSupported()) {
          if (hlsInstance) {
            hlsInstance.destroy();
          }
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.addEventListener('loadedmetadata', function () {
            video.play().catch(function () {});
          }, { once: true });
        } else {
          video.src = source;
          video.play().catch(function () {});
        }
      }

      cover.addEventListener('click', start);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupImages();
    setupMobileNav();
    setupGlobalSearch();
    setupLocalFilters();
    setupPlayers();
  });
})();
