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
assert.match(generator, /\['three', 'two', 'one', 'main'\]/, 'Each image has three fading copies');
assert.ok(!generator.includes('data-camera-view'), 'Only the static front and logo are requested');
assert.ok(css.includes('--copy-drop: 92%'), 'Copies travel almost a full image height');
assert.ok(css.includes('--copy-lag: 180ms'), 'Copies descend in sequence');
assert.ok(css.includes('loader-copy-fall var(--camera-cycle) linear'), 'The descent has constant velocity');
assert.ok(!css.includes('loader-darken'), 'The main picture remains stable while copies move');
console.log('Validated logo-first cycle, 401 phases, foreground copy cascade, continuous descent and subdued flashes.');
