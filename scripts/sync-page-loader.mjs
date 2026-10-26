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
          }, immediate || matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 540);
        };
        state.timeout = setTimeout(() => state.reveal(), 6000);
      })();
    </script>
    <link rel="preload" as="image" href="assets/studio-camera-logo.png" fetchpriority="high">
    <script defer src="js/page-loader.js?v=20261026-logo-fold-loop"></script>
    <!-- page-loader:head:end -->`;
function form(kind, source, width, height) {
  const picture = copy => {
    const marker = copy === 'main' ? 'data-camera-logo' : '';
    return '<img class="page-loader__copy page-loader__copy--' + copy + '" ' + marker
      + ' src="' + source + '" alt="" width="' + width + '" height="' + height + '"'
      + (copy === 'main' ? ' fetchpriority="high"' : '') + ' />';
  };
  const copies = ['one', 'two', 'three', 'four', 'five', 'six'].map(picture).join('');
  return '<div class="page-loader__form page-loader__form--' + kind + '">'
    + picture('main') + '<div class="page-loader__stack">' + copies + '</div></div>';
}
const markup = '<!-- page-loader:body:start -->'
  + '<div class="page-loader" role="status" aria-live="polite" aria-label="Загрузка страницы">'
  + '<div class="page-loader__scene" aria-hidden="true">'
  + form('logo', 'assets/studio-camera-logo.png', 521, 462)
  + '</div></div><!-- page-loader:body:end -->';
for (const file of (await readdir(root)).filter(name => name === 'index.html' || /^case-.*\.html$/.test(name))) {
  const url = new URL(file, root);
  let html = await readFile(url, 'utf8');
  html = html.replace(/\s*<!-- page-loader:head:start -->[\s\S]*?<!-- page-loader:head:end -->/, '');
  html = html.replace(/\s*<!-- page-loader:body:start -->[\s\S]*?<!-- page-loader:body:end -->/, '');
  html = html.replace(/(<meta name="theme-color"[^>]*>)/, `$1\n    ${boot(file !== 'index.html')}`);
  html = html.replace('<body>', `<body>\n    ${markup}`);
  await writeFile(url, html);
}
console.log('Synced the first-paint logo loader across home and case pages.');
