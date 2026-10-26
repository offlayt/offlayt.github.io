import { readFile, writeFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const css = (await readFile(new URL('css/shared/page-loader.css', root), 'utf8')).replaceAll('../../assets/', 'assets/');
const boot = appReady => `<!-- page-loader:head:start -->
    <style id="page-loader-style">${css}</style>
    <script>
      (() => {
        const root = document.documentElement;
        const state = window.__pageLoader = { started: performance.now(), appReady: ${appReady}, finished: false };
        root.classList.add('is-loading');
        state.reveal = (immediate = false) => {
          if (state.finished) return;
          state.finished = true;
          clearTimeout(state.timeout);
          state.unlock?.();
          document.body?.removeAttribute('aria-busy');
          root.classList.remove('is-loading');
          root.classList.add('is-revealing');
          window.dispatchEvent(new Event('portfolio:revealed'));
          setTimeout(() => {
            root.classList.remove('is-revealing');
            document.querySelector('.page-loader')?.remove();
          }, immediate || matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 520);
        };
        state.timeout = setTimeout(() => state.reveal(), 6000);
      })();
    </script>
    <link rel="preload" as="image" href="assets/loading/antique-camera.webp" fetchpriority="high">
    <script defer src="js/page-loader.js?v=20261026-camera-orbit"></script>
    <!-- page-loader:head:end -->`;
const markup = `<!-- page-loader:body:start -->
    <div class="page-loader" role="status" aria-live="polite" aria-label="Загрузка страницы">
      <div class="page-loader__scene" aria-hidden="true">
        <div class="page-loader__camera">
          <img class="page-loader__echo" src="assets/loading/antique-camera.webp" alt="" width="480" height="480" />
          <img class="page-loader__layer page-loader__layer--top" src="assets/loading/antique-camera.webp" alt="" width="480" height="480" fetchpriority="high" />
          <img class="page-loader__layer page-loader__layer--middle" src="assets/loading/antique-camera.webp" alt="" width="480" height="480" />
          <img class="page-loader__layer page-loader__layer--bottom" src="assets/loading/antique-camera.webp" alt="" width="480" height="480" />
          <span class="page-loader__sweep"></span>
        </div>
      </div>
    </div>
    <!-- page-loader:body:end -->`;
for (const file of (await readdir(root)).filter(name => name === 'index.html' || /^case-.*\.html$/.test(name))) {
  const url = new URL(file, root);
  let html = await readFile(url, 'utf8');
  html = html.replace(/\s*<!-- page-loader:head:start -->[\s\S]*?<!-- page-loader:head:end -->/, '');
  html = html.replace(/\s*<!-- page-loader:body:start -->[\s\S]*?<!-- page-loader:body:end -->/, '');
  html = html.replace(/(<meta name="theme-color"[^>]*>)/, `$1\n    ${boot(file !== 'index.html')}`);
  html = html.replace('<body>', `<body>\n    ${markup}`);
  await writeFile(url, html);
}
console.log('Synced the first-paint camera loader across home and case pages.');
