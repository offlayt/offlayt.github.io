/* Classic deferred script: the cover starts from inline HTML before styles download. */
(() => {
  const state = window.__pageLoader;
  const cover = document.querySelector('.page-loader');
  if (!state || state.finished || !cover) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const locked = [...document.body.children].filter(element => element !== cover && !element.inert);
  locked.forEach(element => { element.inert = true; });
  document.body.setAttribute('aria-busy', 'true');
  state.unlock = () => locked.forEach(element => { element.inert = false; });

  const app = state.appReady ? Promise.resolve() : new Promise(resolve => {
    window.addEventListener('portfolio:ready', resolve, { once: true });
  });
  const decode = image => {
    image.loading = 'eager';
    return image.decode().catch(() => {});
  };
  const logo = cover.querySelector('[data-camera-logo]');
  const logoReady = decode(logo).then(() => {
    if (state.finished) return;
    if (logo.naturalWidth > 0) {
      cover.classList.add('is-logo-ready');
    }
  });
  const wallpaper = () => {
    const wall = document.querySelector('.wallpaper');
    const source = wall && getComputedStyle(wall).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    if (!source) return Promise.resolve();
    const image = new Image();
    image.src = source[1];
    return decode(image);
  };
  const visibleImages = () => [...document.images].filter(image => {
    if (cover.contains(image)) return false;
    const box = image.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight;
  });

  app.then(async () => {
    if (state.finished) return;
    const jobs = [logoReady, document.fonts.ready, wallpaper(), ...visibleImages().map(decode)];
    await Promise.allSettled(jobs);
    if (state.finished) return;
    const minimum = reduced.matches ? 0 : 340;
    const remaining = Math.max(0, minimum - (performance.now() - state.started));
    window.setTimeout(() => state.reveal(), remaining);
  });

  window.addEventListener('pageshow', event => {
    if (event.persisted) state.reveal(true);
  });
})();
