(() => {
  try {
    document.documentElement.dataset.lightMode =
      localStorage.getItem('svet-light-mode') === 'uv' ? 'uv' : 'day';
  } catch (_) {
    document.documentElement.dataset.lightMode = 'day';
  }
  const flow = document.querySelector('.case-flow');
  if (!flow) return;
  const desktopFrames = [...flow.querySelectorAll('.demo-desktop > iframe, .case-live > iframe')];
  desktopFrames.forEach((frame) => {
    const viewport = document.createElement('div');
    viewport.className = frame.parentElement.classList.contains('case-live')
      ? 'case-live__viewport'
      : 'demo-desktop__viewport';
    frame.replaceWith(viewport);
    viewport.append(frame);
  });
  const sizeDesktopFrames = () =>
    desktopFrames.forEach((frame) => {
      const width = frame.parentElement.clientWidth;
      if (width) frame.style.transform = `scale(${width / 1920})`;
    });
  sizeDesktopFrames();
  const phoneFrames = [...flow.querySelectorAll('.demo-phone__screen iframe')];
  const sizePhoneFrames = () =>
    phoneFrames.forEach((frame) => {
      const screen = frame.parentElement;
      const scale = screen.clientWidth / 390;
      if (!scale) return;
      frame.style.width = '390px';
      frame.style.height = `${screen.clientHeight / scale}px`;
      frame.style.transformOrigin = 'top left';
      frame.style.transform = `scale(${scale})`;
    });
  sizePhoneFrames();
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => {
      sizePhoneFrames();
      sizeDesktopFrames();
    });
    [...phoneFrames, ...desktopFrames].forEach((frame) =>
      resizeObserver.observe(frame.parentElement),
    );
  } else {
    window.addEventListener(
      'resize',
      () => {
        sizePhoneFrames();
        sizeDesktopFrames();
      },
      { passive: true },
    );
  }
  const videos = [...flow.querySelectorAll('video')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  videos.forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.addEventListener('volumechange', () => {
      if (!video.muted) video.muted = true;
      if (video.volume !== 0) video.volume = 0;
    });
    video.controls = true;
    video.autoplay = false;
  });
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting && !reduceMotion.matches) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { root: flow, threshold: 0.4 },
  );
  videos.forEach((video) => observer.observe(video));
  reduceMotion.addEventListener('change', () => {
    videos.forEach((video) => {
      video.controls = true;
    });
    if (reduceMotion.matches) videos.forEach((video) => video.pause());
  });
})();
