import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const css = await readFile(new URL('css/shared/page-loader.css', root), 'utf8');
function frames(name, property) {
  const source = css.slice(css.indexOf('@keyframes ' + name)).split('\n}')[0];
  const block = source.slice(source.indexOf('{') + 1);
  const result = new Map();
  for (const match of block.matchAll(/([\d%,\s]+)\{([^}]+)\}/g)) {
    const value = match[2].match(new RegExp(property + ':\\s*([^;]+)'))?.[1];
    for (const phase of match[1].match(/\d+/g) || []) result.set(Number(phase), value);
  }
  assert.ok(result.has(0) && result.has(100), name + ': explicit loop endpoints');
  assert.equal(result.get(0), result.get(100), name + ': no jump at the seam');
  return [...result].sort((a,b) => a[0]-b[0]);
}
const poses = ['camera', 'logo'].map(name => frames('loader-' + name + '-form', 'opacity'));
frames('loader-copy-fall', 'transform');
frames('loader-copy-opacity', 'opacity');
frames('loader-original-settle', 'transform');
const flash = frames('loader-soft-flash', 'opacity');
assert.ok(Math.max(...flash.map(([, value]) => Number(value))) <= .16, 'The flash remains subdued');
function opacity(keyframes, phase) {
  const index = keyframes.findIndex(([at]) => at >= phase);
  if (!index) return Number(keyframes[0][1]);
  const [a, av] = keyframes[index-1], [b, bv] = keyframes[index];
  return Number(av) + (Number(bv)-Number(av)) * (phase-a)/(b-a);
}
for (let phase = 0; phase <= 100; phase += .25) {
  const sum = poses.reduce((total, pose) => total + opacity(pose, phase), 0);
  assert.ok(Math.abs(sum-1) < 1e-9, 'No empty or doubled exposure at phase ' + phase);
}
assert.deepEqual(poses.map(p => opacity(p, 20)), [0,1], 'The first half shows the monochrome logo');
assert.deepEqual(poses.map(p => opacity(p, 70)), [1,0], 'The second half shows the antique camera');
for (const filename of ['assets/loading/antique-camera.webp', 'assets/studio-camera-logo.png']) {
  assert.ok((await stat(new URL(filename, root))).size < 100_000, filename + ': lightweight asset');
}
const generator = await readFile(new URL('scripts/sync-page-loader.mjs', root), 'utf8');
const copies = [...css.matchAll(/\.page-loader__copy--(one|two|three|four|five|six)\s*\{([^}]+)\}/g)].map(([, name, rules]) => ({
  name,
  lag: Number(rules.match(/--copy-lag:\s*(\d+)ms/)[1]),
  layer: Number(rules.match(/z-index:\s*(\d+)/)[1]),
  brightness: Number(rules.match(/brightness\(([^)]+)\)/)[1]),
}));
assert.equal(copies.length, 6, 'Six complete descending copies per image');
assert.match(generator, /\['one', 'two', 'three', 'four', 'five', 'six', 'main'\]/);
assert.ok(!generator.includes('data-camera-view'), 'Only the static front and logo are requested');
const duration = Number(css.match(/--camera-cycle:\s*(\d+)ms/)[1]);
assert.equal(duration, 2400, 'Faster 2.4 second loop');
assert.ok(css.includes('--form-offset: -1200ms'), 'Camera copies share the half-cycle offset');
const fadeEnd = frames('loader-copy-opacity', 'opacity').find(([phase, value]) => phase > 27 && Number(value) === 0)[0];
for (let i = 0; i < copies.length; i++) {
  const current = copies[i], previous = copies[i-1];
  assert.ok(fadeEnd / 100 * duration + current.lag < .46 * duration,
    current.name + ': finishes before the outgoing form starts to crossfade');
  assert.ok(current.layer > 1, 'Whole copies render above the original');
  if (previous) {
    assert.ok(current.lag > previous.lag, 'New copies leave later along the same path');
    assert.ok(current.layer > previous.layer, 'New copies overlap older, lower copies');
    assert.ok(current.brightness > previous.brightness, 'Older copies darken toward the bottom');
  }
}
assert.ok(!css.includes('--copy-drop'), 'One shared trajectory prevents late copies overtaking early copies');
assert.ok(css.includes('translateY(110%) scale(.92)'), 'The cascade tapers as it falls');
assert.ok(!css.includes('loader-darken'), 'The main picture remains stable while copies move');
console.log('Validated 401 phases, six ordered copies, shared descent, layer/brightness order, clear transitions and 2.4 second seam.');
