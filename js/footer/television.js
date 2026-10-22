/** A silent decorative broadcast, independent of the portfolio's pause controls. */
export function initRetroTV() {
  const video = document.querySelector('.tv-video');
  if (!video) return;

  video.defaultMuted = true;
  video.muted = true;
  video.volume = 0;

  const play = () => {
    // A denied autoplay can be retried on the first page interaction or return.
    if (video.getAttribute('src') && video.paused) video.play().catch(() => {});
  };
  const start = () => {
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    play();
  };
  if ('IntersectionObserver' in window) {
    // Fetch the broadcast only as the footer approaches. Once started, it keeps
    // looping; scrolling away never pauses it or restarts the clip.
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
    }, { rootMargin: '600px 0px' }).observe(video);
  } else start();
  document.addEventListener('pointerdown', play, { once: true, passive: true });
  document.addEventListener('keydown', play, { once: true });
  window.addEventListener('pageshow', play);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) play();
  });
}
