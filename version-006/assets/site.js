(function () {
  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const palettes = [
    ['#0f172a', '#7c3aed', '#ec4899'],
    ['#1d4ed8', '#06b6d4', '#a855f7'],
    ['#7c2d12', '#ea580c', '#f59e0b'],
    ['#0f766e', '#14b8a6', '#22c55e'],
    ['#312e81', '#6366f1', '#f472b6'],
    ['#701a75', '#c026d3', '#f97316'],
    ['#111827', '#334155', '#22c55e'],
    ['#1e3a8a', '#2563eb', '#60a5fa'],
    ['#3f1d0b', '#92400e', '#f59e0b'],
    ['#0f172a', '#475569', '#8b5cf6']
  ];

  const genrePalettes = {
    '剧情': palettes[0],
    '喜剧': palettes[1],
    '悬疑': palettes[2],
    '动作': palettes[3],
    '爱情': palettes[4],
    '奇幻': palettes[5],
    '惊悚': palettes[6],
    '犯罪': palettes[7],
    '家庭': palettes[8],
    '科幻': palettes[9],
    '古装': ['#1e1b4b', '#4338ca', '#db2777']
  };

  const splitGenres = (text) =>
    String(text || '')
      .split(/[\/,，、]/)
      .map((v) => v.trim())
      .filter(Boolean);

  const paletteFor = (movie) => {
    const key = movie.primaryGenre || splitGenres(movie.genre)[0] || movie.type || '剧情';
    return genrePalettes[key] || palettes[Math.abs(hash(movie.idStr + key)) % palettes.length];
  };

  const hash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i += 1) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return h;
  };

  const escapeHtml = (text) =>
    String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const summarize = (text, limit = 120) => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    return clean.length <= limit ? clean : `${clean.slice(0, limit - 1)}…`;
  };

  const posterStyle = (movie) => {
    const [c1, c2, c3] = paletteFor(movie);
    return `background: radial-gradient(circle at top left, ${c3}66 0%, transparent 38%), linear-gradient(135deg, ${c1} 0%, ${c2} 55%, ${c3} 100%);`;
  };

  const cardHTML = (movie, compact = false) => {
    const tags = (movie.tags || []).slice(0, 3).map((tag) => `<span class="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">${escapeHtml(tag)}</span>`).join('');
    return `
      <article class="catalog-card group overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <a href="${escapeHtml(movie.href)}" class="block">
          <div class="poster-tile ${compact ? 'poster-xs' : 'poster-sm'}" style="${posterStyle(movie)}">
            <div class="poster-glow"></div>
            <div class="absolute left-3 top-3 flex gap-2">
              <span class="rounded-full bg-black/30 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">${escapeHtml(movie.year)}</span>
              <span class="rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">${escapeHtml(movie.primaryGenre || movie.type)}</span>
            </div>
            <div class="absolute inset-0 flex items-end p-4">
              <div class="w-full text-white">
                <p class="text-[11px] uppercase tracking-[0.28em] text-white/70">#${escapeHtml(movie.idStr)}</p>
                <h3 class="mt-2 text-lg font-bold leading-tight line-clamp-2">${escapeHtml(movie.title)}</h3>
                <p class="mt-2 text-xs leading-relaxed text-white/85 line-clamp-2">${escapeHtml(movie.one_line || movie.summary || '')}</p>
              </div>
            </div>
          </div>
          <div class="p-4">
            <div class="flex items-center justify-between text-xs text-slate-500">
              <span>${escapeHtml(movie.region)}</span>
              <span>${escapeHtml(movie.year)} · ${escapeHtml(movie.type)}</span>
            </div>
            <p class="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-2">${escapeHtml(summarize(movie.summary || movie.one_line || '', compact ? 68 : 92))}</p>
            <div class="mt-3 flex flex-wrap gap-2">${tags}</div>
          </div>
        </a>
      </article>
    `;
  };

  const initMobileMenu = () => {
    const btn = qs('[data-menu-toggle]');
    const menu = qs('[data-mobile-menu]');
    if (!btn || !menu) return;
    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  };

  const initSearchForms = () => {
    qsa('form[data-search-form]').forEach((form) => {
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const input = form.querySelector('input[name="q"]');
        const value = input ? input.value.trim() : '';
        const target = form.dataset.target || 'search.html';
        const params = new URLSearchParams(window.location.search);
        if (value) {
          params.set('q', value);
        } else {
          params.delete('q');
        }
        window.location.href = `${target}?${params.toString()}`;
      });
    });
  };

  const loadHls = () => new Promise((resolve, reject) => {
    if (window.Hls) {
      resolve(window.Hls);
      return;
    }
    const existing = document.querySelector('script[data-hls-loader]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Hls));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js';
    script.async = true;
    script.defer = true;
    script.dataset.hlsLoader = '1';
    script.onload = () => resolve(window.Hls);
    script.onerror = () => reject(new Error('Hls.js load failed'));
    document.head.appendChild(script);
  });

  const initPlayer = async () => {
    const video = qs('video[data-hls-src]');
    if (!video) return;

    const src = video.dataset.hlsSrc;
    const overlay = qs('[data-player-overlay]');
    const playBtn = qs('[data-play-button]');

    const showOverlay = () => {
      if (overlay) overlay.classList.remove('hidden');
    };
    const hideOverlay = () => {
      if (overlay) overlay.classList.add('hidden');
    };

    const attach = async () => {
      try {
        const HlsLib = await loadHls().catch(() => null);
        if (HlsLib && HlsLib.isSupported()) {
          const hls = new HlsLib({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(src);
          hls.attachMedia(video);
          video.dataset.hlsAttached = '1';
          return;
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.dataset.hlsAttached = '1';
          return;
        }
        if (overlay) {
          overlay.innerHTML = '<div class="max-w-lg"><div class="text-5xl mb-4">🎬</div><p class="text-lg font-semibold">当前浏览器不支持 HLS 播放</p><p class="mt-2 text-sm text-white/80">可尝试使用支持 HLS 的浏览器，或等待系统自动切换。</p></div>';
        }
      } catch (err) {
        if (overlay) {
          overlay.innerHTML = '<div class="max-w-lg"><div class="text-5xl mb-4">⚠️</div><p class="text-lg font-semibold">播放器初始化失败</p><p class="mt-2 text-sm text-white/80">请检查网络或稍后重试。</p></div>';
        }
      }
    };

    if (playBtn) {
      playBtn.addEventListener('click', async () => {
        if (!video.dataset.hlsAttached) {
          await attach();
        }
        try {
          await video.play();
          hideOverlay();
        } catch (err) {
          showOverlay();
        }
      });
    }

    video.addEventListener('play', hideOverlay);
    video.addEventListener('pause', () => {
      if (video.currentTime === 0) showOverlay();
    });
    video.addEventListener('ended', showOverlay);

    if (overlay) overlay.classList.remove('hidden');
    await attach();
  };

  const getAllMovies = () => Array.isArray(window.ALL_MOVIES) ? window.ALL_MOVIES : [];

  const renderSearchPage = () => {
    if (document.body.dataset.page !== 'search') return;
    const resultsEl = qs('#search-results');
    const summaryEl = qs('#search-summary');
    const pagerEl = qs('#search-pagination');
    const inputEl = qs('#query-input');
    const genreEl = qs('#genre-filter');
    const sortEl = qs('#sort-filter');
    if (!resultsEl || !summaryEl || !pagerEl) return;

    const movies = getAllMovies();
    const params = new URLSearchParams(window.location.search);
    const pageSize = 24;

    const toScore = (movie, q) => {
      if (!q) return 0;
      const hay = [
        movie.title, movie.genre, (movie.tags || []).join(' '), movie.one_line, movie.summary, movie.region, movie.type
      ].join(' ').toLowerCase();
      const needle = q.toLowerCase();
      if (movie.title.toLowerCase() === needle) return 100;
      let score = 0;
      if (movie.title.toLowerCase().includes(needle)) score += 50;
      if (hay.includes(needle)) score += 20;
      if ((movie.tags || []).some((tag) => tag.toLowerCase().includes(needle))) score += 10;
      if (movie.genre.toLowerCase().includes(needle)) score += 8;
      return score;
    };

    const filterAndSort = () => {
      const q = (inputEl ? inputEl.value : params.get('q') || '').trim();
      const genre = genreEl ? genreEl.value : (params.get('genre') || '');
      const sort = sortEl ? sortEl.value : (params.get('sort') || 'relevance');

      let filtered = movies.slice();
      if (q) {
        filtered = filtered.filter((movie) => {
          const hay = [
            movie.title, movie.genre, (movie.tags || []).join(' '), movie.one_line, movie.summary, movie.region, movie.type
          ].join(' ').toLowerCase();
          return hay.includes(q.toLowerCase());
        });
      }
      if (genre) {
        filtered = filtered.filter((movie) => (movie.genre || '').includes(genre));
      }

      if (sort === 'latest') {
        filtered.sort((a, b) => Number(b.year) - Number(a.year) || Number(b.views) - Number(a.views));
      } else if (sort === 'popular') {
        filtered.sort((a, b) => Number(b.views) - Number(a.views));
      } else if (sort === 'likes') {
        filtered.sort((a, b) => Number(b.likes) - Number(a.likes));
      } else {
        const qNorm = (q || '').toLowerCase();
        filtered.sort((a, b) => {
          const diff = toScore(b, qNorm) - toScore(a, qNorm);
          if (diff) return diff;
          return Number(b.views) - Number(a.views);
        });
      }

      const total = filtered.length;
      const page = Math.max(1, Number(params.get('page') || '1'));
      const maxPage = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(page, maxPage);
      const start = (safePage - 1) * pageSize;
      const slice = filtered.slice(start, start + pageSize);

      summaryEl.textContent = `已找到 ${total} 部影片，当前第 ${safePage} / ${maxPage} 页`;
      resultsEl.innerHTML = slice.map((movie) => cardHTML(movie, true)).join('');

      const navButtons = [];
      const makePageUrl = (p) => {
        const next = new URLSearchParams(params);
        if (q) next.set('q', q); else next.delete('q');
        if (genre) next.set('genre', genre); else next.delete('genre');
        if (sort) next.set('sort', sort); else next.delete('sort');
        next.set('page', String(p));
        return `search.html?${next.toString()}`;
      };

      navButtons.push(`<a class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 ${safePage <= 1 ? 'pointer-events-none opacity-40' : ''}" href="${safePage <= 1 ? '#' : makePageUrl(safePage - 1)}">上一页</a>`);
      const windowStart = Math.max(1, safePage - 2);
      const windowEnd = Math.min(maxPage, safePage + 2);
      if (windowStart > 1) navButtons.push(`<a class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50" href="${makePageUrl(1)}">1</a>`);
      if (windowStart > 2) navButtons.push('<span class="px-2 text-slate-400">…</span>');
      for (let p = windowStart; p <= windowEnd; p += 1) {
        navButtons.push(`<a class="rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1 ${p === safePage ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white ring-transparent' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}" href="${makePageUrl(p)}">${p}</a>`);
      }
      if (windowEnd < maxPage - 1) navButtons.push('<span class="px-2 text-slate-400">…</span>');
      if (windowEnd < maxPage) navButtons.push(`<a class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50" href="${makePageUrl(maxPage)}">${maxPage}</a>`);
      navButtons.push(`<a class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 ${safePage >= maxPage ? 'pointer-events-none opacity-40' : ''}" href="${safePage >= maxPage ? '#' : makePageUrl(safePage + 1)}">下一页</a>`);
      pagerEl.innerHTML = `<div class="flex flex-wrap items-center justify-center gap-2">${navButtons.join('')}</div>`;
    };

    if (inputEl) {
      inputEl.value = params.get('q') || '';
      inputEl.addEventListener('input', () => {
        const next = new URLSearchParams(window.location.search);
        if (inputEl.value.trim()) next.set('q', inputEl.value.trim()); else next.delete('q');
        next.delete('page');
        window.history.replaceState({}, '', `search.html?${next.toString()}`);
        renderSearchPage();
      });
    }
    if (genreEl) {
      genreEl.value = params.get('genre') || '';
      genreEl.addEventListener('change', () => {
        const next = new URLSearchParams(window.location.search);
        if (genreEl.value) next.set('genre', genreEl.value); else next.delete('genre');
        next.delete('page');
        window.history.replaceState({}, '', `search.html?${next.toString()}`);
        renderSearchPage();
      });
    }
    if (sortEl) {
      sortEl.value = params.get('sort') || 'relevance';
      sortEl.addEventListener('change', () => {
        const next = new URLSearchParams(window.location.search);
        if (sortEl.value) next.set('sort', sortEl.value); else next.delete('sort');
        next.delete('page');
        window.history.replaceState({}, '', `search.html?${next.toString()}`);
        renderSearchPage();
      });
    }

    filterAndSort();
  };

  ready(() => {
    initMobileMenu();
    initSearchForms();
    initPlayer();
    renderSearchPage();
  });
})();
