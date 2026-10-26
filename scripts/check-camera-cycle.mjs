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
const poses = ['front', 'left', 'right'].map(name => frames('loader-view-' + name, 'opacity'));
frames('loader-float', 'transform');
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
assert.deepEqual(poses.map(p => opacity(p, 24)), [0,1,0], 'Left state is shown fully');
assert.deepEqual(poses.map(p => opacity(p, 70)), [0,0,1], 'Right state is shown fully');
for (const filename of ['antique-camera.webp', 'antique-camera-left.webp', 'antique-camera-right.webp', 'antique-camera-closed.webp']) {
  assert.ok((await stat(new URL('assets/loading/' + filename, root))).size < 100_000, filename + ': lightweight frame');
}
assert.ok(!css.includes('clip-path'), 'Whole camera states replace sliced artwork');
console.log('Validated 401 loop phases, opacity continuity, matching seam, distinct side states and four optimized assets.');
