(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function setupMenu() {
    var header = document.querySelector(".site-header");
    var button = document.querySelector(".menu-toggle");
    if (!header || !button) {
      return;
    }
    button.addEventListener("click", function () {
      header.classList.toggle("open");
    });
  }

  function setupHero() {
    var hero = document.querySelector(".hero");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(
      hero.querySelectorAll(".hero-slide"),
    );
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        start();
      });
    });
    function start() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }
    show(0);
    start();
  }

  function setupFilters() {
    var inputs = Array.prototype.slice.call(
      document.querySelectorAll("[data-filter-input]"),
    );
    var chips = Array.prototype.slice.call(
      document.querySelectorAll(".filter-chip"),
    );
    var cards = Array.prototype.slice.call(
      document.querySelectorAll(".movie-card, .rank-item"),
    );
    if (!inputs.length && !chips.length) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var q = (params.get("q") || "").trim();
    inputs.forEach(function (input) {
      if (q && !input.value) {
        input.value = q;
      }
    });
    var activeGenre = "all";
    function apply() {
      var term = "";
      inputs.forEach(function (input) {
        if (input.value.trim()) {
          term = input.value.trim().toLowerCase();
        }
      });
      var visible = 0;
      cards.forEach(function (card) {
        var text = (card.getAttribute("data-search") || "").toLowerCase();
        var genre = card.getAttribute("data-genre") || "";
        var matchesTerm = !term || text.indexOf(term) !== -1;
        var matchesGenre =
          activeGenre === "all" ||
          genre.indexOf(activeGenre) !== -1 ||
          text.indexOf(activeGenre) !== -1;
        var ok = matchesTerm && matchesGenre;
        card.style.display = ok ? "" : "none";
        if (ok) {
          visible += 1;
        }
      });
      document.body.classList.toggle(
        "has-empty",
        visible === 0 && cards.length > 0,
      );
    }
    inputs.forEach(function (input) {
      input.addEventListener("input", apply);
    });
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (item) {
          item.classList.remove("active");
        });
        chip.classList.add("active");
        activeGenre = chip.getAttribute("data-filter") || "all";
        apply();
      });
    });
    apply();
  }

  function setupPlayers() {
    var panels = Array.prototype.slice.call(
      document.querySelectorAll(".player-panel"),
    );
    panels.forEach(function (panel) {
      var video = panel.querySelector("video");
      var button = panel.querySelector(".player-start");
      var stream = panel.getAttribute("data-stream");
      var attached = false;
      function start() {
        if (!video || !stream) {
          return;
        }
        if (!attached) {
          attached = true;
          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = stream;
          } else if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true,
            });
            hls.loadSource(stream);
            hls.attachMedia(video);
          } else {
            video.src = stream;
          }
        }
        if (button) {
          button.classList.add("is-hidden");
        }
        video.controls = true;
        var play = video.play();
        if (play && typeof play.catch === "function") {
          play.catch(function () {});
        }
      }
      if (button) {
        button.addEventListener("click", start);
      }
      if (video) {
        video.addEventListener("click", function () {
          if (!attached) {
            start();
          }
        });
      }
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayers();
  });
})();
