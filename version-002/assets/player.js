(function () {
    function setupMoviePlayer(source) {
        var video = document.getElementById('movie-video');
        var overlay = document.getElementById('player-overlay');
        var playButton = document.getElementById('player-play');
        var started = false;
        var hls = null;
        if (!video) {
            return;
        }
        function attach() {
            if (started) {
                return;
            }
            started = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                hls.loadSource(source);
                hls.attachMedia(video);
            } else {
                video.src = source;
            }
        }
        function hideOverlay() {
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
        }
        function play() {
            attach();
            hideOverlay();
            var result = video.play();
            if (result && typeof result.catch === 'function') {
                result.catch(function () {
                    video.setAttribute('controls', 'controls');
                });
            }
        }
        if (overlay) {
            overlay.addEventListener('click', play);
        }
        if (playButton) {
            playButton.addEventListener('click', function (event) {
                event.stopPropagation();
                play();
            });
        }
        video.addEventListener('click', function () {
            if (!started) {
                play();
            }
        });
        video.addEventListener('play', hideOverlay);
        window.addEventListener('pagehide', function () {
            if (hls && typeof hls.destroy === 'function') {
                hls.destroy();
            }
        });
    }
    window.setupMoviePlayer = setupMoviePlayer;
}());
