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
  const front = cover.querySelector('[data-camera-front]');
  const cameraReady = decode(front);
  // Extra views never delay the page. Animate only after both angles decoded.
  const views = [...cover.querySelectorAll('[data-camera-view]')];
  Promise.allSettled(views.map(decode)).then(() => {
    if (!state.finished && views.every(image => image.naturalWidth > 0)) cover.classList.add('has-camera-views');
  });
  const closed = cover.querySelector('[data-camera-closed]');
  decode(closed).then(() => {
    if (!state.finished && closed.naturalWidth > 0) cover.classList.add('has-camera-closed');
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
    const jobs = [cameraReady, document.fonts.ready, wallpaper(), ...visibleImages().map(decode)];
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
