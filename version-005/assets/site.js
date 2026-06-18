(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setupMobileMenu() {
    var button = document.querySelector('[data-mobile-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    if (!button || !menu) {
      return;
    }
    button.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var root = document.querySelector('[data-hero]');
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    var prev = root.querySelector('[data-hero-prev]');
    var next = root.querySelector('[data-hero-next]');
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('.player[data-src]'));
    players.forEach(function (player) {
      var video = player.querySelector('video');
      var cover = player.querySelector('.player-cover');
      var src = player.getAttribute('data-src');
      var hlsInstance = null;
      var started = false;
      if (!video || !src) {
        return;
      }

      function playVideo() {
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {});
        }
      }

      function attach() {
        if (!started) {
          started = true;
          player.classList.add('is-playing');
          if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
            hlsInstance.loadSource(src);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
            hlsInstance.on(window.Hls.Events.ERROR, function (_event, data) {
              if (!data || !data.fatal) {
                return;
              }
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                hlsInstance.startLoad();
              } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                hlsInstance.recoverMediaError();
              } else {
                hlsInstance.destroy();
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.addEventListener('loadedmetadata', playVideo, { once: true });
          } else {
            video.src = src;
            playVideo();
          }
        } else if (video.paused) {
          playVideo();
        }
      }

      if (cover) {
        cover.addEventListener('click', attach);
      }
      video.addEventListener('click', function () {
        if (!started || video.paused) {
          attach();
        }
      });
      window.addEventListener('pagehide', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function setupSearch() {
    var results = document.querySelector('[data-search-results]');
    var heading = document.querySelector('[data-search-heading]');
    var input = document.querySelector('[data-search-input]');
    if (!results || !window.MOVIES) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var q = (params.get('q') || '').trim();
    if (input) {
      input.value = q;
    }
    if (!q) {
      return;
    }
    var lower = q.toLowerCase();
    var matched = window.MOVIES.filter(function (movie) {
      var haystack = [movie.title, movie.type, movie.region, movie.year, movie.genre, movie.oneLine]
        .concat(movie.tags || [])
        .join(' ')
        .toLowerCase();
      return haystack.indexOf(lower) !== -1;
    }).slice(0, 120);
    if (heading) {
      heading.textContent = '搜索结果：' + q + '（' + matched.length + '）';
    }
    if (!matched.length) {
      results.innerHTML = '<p class="empty-result">没有找到相关影片，可以换一个关键词。</p>';
      return;
    }
    results.innerHTML = matched.map(function (movie) {
      var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');
      return [
        '<a class="movie-card" href="' + escapeHtml(movie.url) + '">',
        '  <figure>',
        '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + ' 封面" loading="lazy">',
        '    <span class="type-badge">' + escapeHtml(movie.type) + '</span>',
        '  </figure>',
        '  <div class="movie-card-body">',
        '    <h3>' + escapeHtml(movie.title) + '</h3>',
        '    <p>' + escapeHtml(movie.oneLine) + '</p>',
        '    <div class="movie-meta">',
        '      <span>' + escapeHtml(movie.year) + '</span>',
        '      <span>' + escapeHtml(movie.region) + '</span>',
        '      <span>' + escapeHtml(movie.genre) + '</span>',
        '    </div>',
        '    <div class="mini-tags">' + tags + '</div>',
        '  </div>',
        '</a>'
      ].join('');
    }).join('');
  }

  ready(function () {
    setupMobileMenu();
    setupHero();
    setupPlayers();
    setupSearch();
  });
})();
