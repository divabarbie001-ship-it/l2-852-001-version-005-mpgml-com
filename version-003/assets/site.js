
(function () {
  function qs(root, sel) {
    return (root || document).querySelector(sel);
  }

  function qsa(root, sel) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function initNav() {
    const toggle = qs(document, "[data-nav-toggle]");
    const nav = qs(document, "[data-nav]");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
    });

    qsa(document, "[data-nav-link]").forEach(function (link) {
      if (link.href === window.location.href) {
        link.classList.add("active");
      }
    });
  }

  function applyTextFilter(scope) {
    const input = qs(scope, "[data-filter-input]");
    const sort = qs(scope, "[data-filter-sort]");
    const grids = qsa(scope, "[data-filter-grid]");
    const cards = qsa(scope, "[data-card]");
    if (!input || !cards.length) return;

    function filterNow() {
      const term = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        const bag = [
          card.dataset.title || "",
          card.dataset.tags || "",
          card.dataset.genre || "",
          card.dataset.region || "",
          card.dataset.year || "",
          card.dataset.summary || ""
        ].join(" ").toLowerCase();
        card.classList.toggle("hidden", term && bag.indexOf(term) === -1);
      });

      if (sort && grids.length) {
        const mode = sort.value;
        const grid = grids[0];
        const list = cards.slice().filter(function (card) {
          return !card.classList.contains("hidden");
        });
        list.sort(function (a, b) {
          const ay = parseInt(a.dataset.year || "0", 10);
          const by = parseInt(b.dataset.year || "0", 10);
          const at = a.dataset.title || "";
          const bt = b.dataset.title || "";
          const ar = a.dataset.region || "";
          const br = b.dataset.region || "";
          if (mode === "year-asc") return ay - by;
          if (mode === "title") return at.localeCompare(bt, "zh-Hans-CN");
          if (mode === "region") return ar.localeCompare(br, "zh-Hans-CN") || by - ay;
          return by - ay || at.localeCompare(bt, "zh-Hans-CN");
        });
        list.forEach(function (card) { grid.appendChild(card); });
      }
    }

    input.addEventListener("input", filterNow);
    if (sort) sort.addEventListener("change", filterNow);
    filterNow();
  }

  function initHeroSlider() {
    const slider = qs(document, "[data-hero-slider]");
    const dots = qsa(document, "[data-hero-dot]");
    if (!slider) return;

    const slides = qsa(slider, "[data-hero-slide]");
    if (!slides.length) return;

    let index = 0;
    let timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slider.style.transform = "translateX(" + (-index * 100) + "%)";
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
      const activeSlide = slides[index];
      const title = qs(document, "[data-hero-title]");
      const desc = qs(document, "[data-hero-desc]");
      const link = qs(document, "[data-hero-link]");
      if (title && activeSlide.dataset.title) title.textContent = activeSlide.dataset.title;
      if (desc && activeSlide.dataset.desc) desc.textContent = activeSlide.dataset.desc;
      if (link && activeSlide.dataset.link) link.href = activeSlide.dataset.link;
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });

    function restart() {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    show(0);
    restart();
  }

  function initPlayer() {
    const player = qs(document, "[data-player]");
    if (!player) return;
    const video = qs(player, "video");
    const playBtn = qs(player, "[data-play-button]");
    const overlay = qs(player, "[data-play-overlay]");

    if (!video) return;

    function hideOverlay() {
      if (overlay) overlay.classList.add("hide");
    }

    function showOverlay() {
      if (overlay) overlay.classList.remove("hide");
    }

    if (playBtn) {
      playBtn.addEventListener("click", function (e) {
        e.preventDefault();
        video.play().catch(function () {});
      });
    }

    if (overlay) {
      overlay.addEventListener("click", function () {
        video.play().catch(function () {});
      });
    }

    video.addEventListener("play", hideOverlay);
    video.addEventListener("pause", function () {
      if (video.currentTime < video.duration) showOverlay();
    });

    if (video.dataset.m3u8) {
      if (window.Hls && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(video.dataset.m3u8);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = video.dataset.m3u8;
      }
    }
  }

  function initPageJump() {
    qsa(document, "[data-jump-target]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        const sel = btn.getAttribute("data-jump-target");
        const target = qs(document, sel);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  function initHeaderSearch() {
    const search = qs(document, "[data-header-search]");
    if (!search) return;
    search.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        const scope = search.closest("[data-filter-scope]") || document;
        const input = qs(scope, "[data-filter-input]");
        if (input) {
          input.value = search.value;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          const target = qs(scope, "[data-filter-grid]");
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    qsa(document, "[data-filter-scope]").forEach(applyTextFilter);
    initHeroSlider();
    initPlayer();
    initPageJump();
    initHeaderSearch();
  });
})();
