import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const css = await readFile(new URL('css/shared/page-loader.css', root), 'utf8');
function frames(name, property) {
  const source = css.slice(css.indexOf('@keyframes ' + name)).split('\n}')[0];
  const result = new Map();
  for (const match of source.slice(source.indexOf('{') + 1).matchAll(/([\d%,\s]+)\{([^}]+)\}/g)) {
    const value = match[2].match(new RegExp(property + ':\\s*([^;]+)'))?.[1];
    if (value === undefined) continue;
    for (const phase of match[1].match(/\d+/g) || []) result.set(Number(phase), value);
  }
  assert.ok(result.has(0) && result.has(100), name + ': explicit loop endpoints');
  assert.equal(result.get(0), result.get(100), name + ': no jump at the seam');
  return [...result].sort((a,b) => a[0]-b[0]);
}
function valueAt(keyframes, phase) {
  const index = keyframes.findIndex(([at]) => at >= phase);
  if (!index) return Number(keyframes[0][1]);
  const [a, av] = keyframes[index-1], [b, bv] = keyframes[index];
  return Number(av) + (Number(bv)-Number(av)) * (phase-a)/(b-a);
}
const duration = Number(css.match(/--logo-cycle:\s*(\d+)ms/)[1]);
const copies = [...css.matchAll(/\.page-loader__copy--(one|two|three|four|five|six)\s*\{([^}]+)\}/g)].map(([, name, rules]) => {
  const motion = frames('loader-copy-' + name, 'transform');
  const alpha = frames('loader-copy-' + name, 'opacity');
  const stops = motion.filter(([,value]) => value.includes('--copy-drop')).map(([phase]) => phase);
  const starts = motion.filter(([,value]) => value.includes('--copy-start')).map(([phase]) => phase);
  return {
    name, alpha,
    start: Number(rules.match(/--copy-start:\s*(\d+)%/)[1]),
    drop: Number(rules.match(/--copy-drop:\s*(\d+)%/)[1]),
    layer: Number(rules.match(/z-index:\s*(\d+)/)[1]),
    brightness: Number(rules.match(/brightness\(([^)]+)\)/)[1]),
    unfoldStart: starts[1], unfoldEnd: stops[0], foldStart: stops[1], foldEnd: starts[2],
  };
});
assert.equal(copies.length, 6);
const approach = frames('loader-original-approach', 'transform');
assert.equal(approach.find(([at]) => at === 4)[1], 'scale(1.04)', 'Original approaches before the cascade');
assert.equal(approach.find(([at]) => at === 48)[1], 'scale(1)', 'Original returns before the final pause');
for (let i = 0; i < copies.length; i++) {
  const copy = copies[i], previous = copies[i-1];
  assert.ok(copy.unfoldEnd < copy.foldStart, 'A real hold separates unfolding and folding');
  assert.ok(copy.drop-copy.start <= 15 && copy.drop < 80, 'Copies overlap without detaching');
  assert.equal(valueAt(copy.alpha, 0), 0, 'No copies appear at the cycle start');
  if (previous) {
    assert.equal(copy.start, previous.drop, 'Each copy emerges from its predecessor');
    assert.ok(copy.unfoldStart >= previous.unfoldEnd, 'Copies unfold one at a time');
    assert.ok(copy.foldEnd <= previous.foldStart, 'Copies fold back in reverse order');
    assert.ok(copy.layer > previous.layer, 'Each new copy overlaps the previous');
    assert.ok(copy.brightness < previous.brightness, 'Lower copies are darker');
  } else {
    assert.equal(copy.start, 0);
    assert.ok(copy.unfoldStart >= 4, 'The first copy waits for the approach');
  }
}
const hold = (copies.at(-1).foldStart-copies.at(-1).unfoldEnd)/100*duration;
assert.ok(hold >= 500 && hold <= 1000, 'Brief hold with the complete stack');
const pause = (100-48)/100*duration;
assert.ok(pause >= 1800 && pause <= 2200, 'About two seconds idle after collapsing');
for (const [phase, count] of [[0,0],[4,0],[6,1],[8,2],[10,3],[12,4],[14,5],[16,6],[31,6],[35,5],[37,4],[39,3],[41,2],[43,1],[45,0],[48,0],[99,0],[100,0],[200,0]]) {
  const visible = copies.filter(copy => valueAt(copy.alpha, phase%100) > .02).length;
  assert.equal(visible, count, 'Sequential unfolding/folding at phase ' + phase);
}
for (let phase=48; phase<=100; phase+=.25) {
  assert.ok(copies.every(copy => valueAt(copy.alpha, phase) === 0), 'No ghost copies during the idle pause');
}
const generator = await readFile(new URL('scripts/sync-page-loader.mjs', root), 'utf8');
assert.ok(!generator.includes('antique-camera') && !generator.includes('page-loader__flash'), 'No realistic camera or flash stage');
assert.ok(!css.includes('animation-delay'), 'No delayed frames leak from a previous loop');
assert.ok((await stat(new URL('assets/studio-camera-logo.png', root))).size < 100_000);
console.log('Validated logo-only loop, sequential unfolding, reverse folding, lower-copy darkening, 640ms hold, 2080ms pause and clean loop seam.');
