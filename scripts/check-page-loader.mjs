import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const bootstrap = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const script = await readFile(new URL('js/page-loader.js', root), 'utf8');
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

function harness({ reduced = false, pendingFonts = false, brokenImage = false, pendingCamera = false } = {}) {
  let now = 0, sequence = 0, removed = false;
  const timers = new Map(), classes = new Set(), attrs = new Map();
  const events = new EventTarget();
  const content = { inert: false }, alreadyInert = { inert: true };
  const camera = { loading: 'eager', decode: () => pendingCamera ? new Promise(() => {}) : Promise.resolve() };
  const cover = {
    contains: () => false,
    querySelectorAll: () => [camera],
    remove: () => { removed = true; },
  };
  let offscreenDecoded = false;
  const image = (top, decode) => ({ loading: 'lazy', getBoundingClientRect: () => ({ top, bottom: top + 100, width: 100, height: 100 }), decode });
  const visible = image(10, () => brokenImage ? Promise.reject(new Error('missing image')) : Promise.resolve());
  const offscreen = image(5000, () => { offscreenDecoded = true; return new Promise(() => {}); });
  const document = {
    documentElement: { classList: { add: c => classes.add(c), remove: c => classes.delete(c) } },
    body: { children: [cover, content, alreadyInert], setAttribute: (k,v) => attrs.set(k,v), removeAttribute: k => attrs.delete(k) },
    querySelector: selector => selector === '.page-loader' && !removed ? cover : null,
    images: [visible, offscreen],
    fonts: { ready: pendingFonts ? new Promise(() => {}) : Promise.resolve() },
  };
  const window = {
    innerHeight: 800,
    addEventListener: (...args) => events.addEventListener(...args),
    dispatchEvent: (...args) => events.dispatchEvent(...args),
  };
  const setTimeout = (fn, delay = 0) => { const id = ++sequence; timers.set(id, { fn, at: now + delay }); return id; };
  const clearTimeout = id => timers.delete(id);
  const matchMedia = () => ({ matches: reduced });
  Object.assign(window, { setTimeout, matchMedia });
  const context = vm.createContext({ window, document, performance: { now: () => now }, setTimeout, clearTimeout, matchMedia, Event, Promise });
  vm.runInContext(bootstrap, context);
  vm.runInContext(script, context);
  async function advance(ms) {
    const end = now + ms;
    await flush();
    while (true) {
      const due = [...timers].filter(([, t]) => t.at <= end).sort((a,b) => a[1].at-b[1].at)[0];
      if (!due) break;
      now = due[1].at;
      timers.delete(due[0]);
      due[1].fn();
      await flush();
    }
    now = end;
  }
  return { window, content, alreadyInert, classes, attrs, advance,
    get removed() { return removed; }, get offscreenDecoded() { return offscreenDecoded; },
    ready() { window.dispatchEvent(new Event('portfolio:ready')); },
  };
}

const normal = harness();
assert.equal(normal.content.inert, true, 'Underlying controls cannot receive focus during loading');
normal.ready();
await normal.advance(339);
assert.equal(normal.window.__pageLoader.finished, false, 'Fast loads get one short camera beat');
await normal.advance(1);
assert.equal(normal.window.__pageLoader.finished, true, 'First-screen readiness reveals without waiting for window.load');
assert.equal(normal.offscreenDecoded, false, 'Below-fold images never hold the cover');
assert.equal(normal.content.inert, false);
assert.equal(normal.alreadyInert.inert, true, 'Existing inert state is preserved');
assert.equal(normal.attrs.has('aria-busy'), false);
await normal.advance(520);
assert.equal(normal.removed, true);
assert.equal(normal.classes.size, 0, 'Both cover and scroll lock are removed');

for (const options of [{ pendingFonts: true }, { pendingCamera: true }, {}]) {
  const stalled = harness(options);
  if (options.pendingFonts || options.pendingCamera) stalled.ready();
  await stalled.advance(6000);
  assert.equal(stalled.window.__pageLoader.finished, true, 'Missing app, hanging fonts or camera cannot block the site');
  assert.equal(stalled.content.inert, false);
  stalled.ready();
  await stalled.advance(520);
  assert.equal(stalled.removed, true, 'Late readiness never restarts the cover');
}
const failed = harness({ brokenImage: true, reduced: true });
failed.ready();
await failed.advance(0);
assert.equal(failed.removed, true, 'Broken images settle; reduced motion skips the artificial minimum');
const restored = harness();
const pageshow = new Event('pageshow');
Object.defineProperty(pageshow, 'persisted', { value: true });
restored.window.dispatchEvent(pageshow);
await restored.advance(0);
assert.equal(restored.removed, true, 'Back/forward cache never replays the loader');
for (const name of ['index.html', 'case-aititek.html']) {
  const page = await readFile(new URL(name, root), 'utf8');
  assert.equal((page.match(/id="page-loader-style"/g) || []).length, 1);
  assert.match(page, /\.page-loader \{ display: none; \}/, 'Without JS, content remains accessible');
}
const loaderMarkup = html.match(/<!-- page-loader:body:start -->([\s\S]*?)<!-- page-loader:body:end -->/)[1];
assert.equal(loaderMarkup.replace(/<[^>]*>/g, '').trim(), '', 'Loader has no visible text');
assert.ok(!loaderMarkup.includes('studio-camera-logo'), 'Loader uses a physical camera rather than the logo');
assert.ok(loaderMarkup.includes('assets/loading/antique-camera.webp'));
console.log('Validated first-screen gating, lazy media, image errors, app/font timeout, inert cleanup, reduced motion and bfcache.');
