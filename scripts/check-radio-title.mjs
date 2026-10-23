import assert from 'node:assert/strict';
import { createRadioTitle, spectrumBars } from '../js/footer/radio-title.js';

const spectrum = { bins: new Uint8Array(256), sampleRate: 48000, fftSize: 512 };
assert.equal(spectrumBars(spectrum), '⠀'.repeat(8), 'Silence produces no bars');
spectrum.bins[2] = 255;
const bass = spectrumBars(spectrum);
assert.notEqual(bass[0], '⠀', 'Low frequencies move the bass column');
assert.equal(bass.at(-1), '⠀', 'Bass does not move the treble column');
spectrum.bins.fill(0);
spectrum.bins.fill(255, 34, 46);
const treble = spectrumBars(spectrum);
assert.equal(treble[0], '⠀');
assert.equal(treble.at(-1), '⡇', 'High frequencies move the treble column');
spectrum.bins.fill(80);

const originalInterval = globalThis.setInterval;
const originalClear = globalThis.clearInterval;
const intervals = new Map();
globalThis.setInterval = callback => { const key = Symbol(); intervals.set(key, callback); return key; };
globalThis.clearInterval = key => intervals.delete(key);
globalThis.document = { title: 'Портфолио' };
globalThis.window = new EventTarget();
const audio = new EventTarget();
audio.paused = true;
audio.ended = false;
let enabled = false;
const fire = event => audio.dispatchEvent(new Event(event));
const tick = () => [...intervals.values()].forEach(callback => callback());
const idle = () => {
  assert.equal(document.title, 'Портфолио');
  assert.equal(intervals.size, 0, 'Idle radio never keeps an animation timer');
};
const playing = () => {
  enabled = true;
  audio.paused = false;
  audio.ended = false;
  fire('playing');
  assert.match(document.title, /^[⠀⡀⡄⡆⡇]+ · Портфолио$/u);
  assert.equal(intervals.size, 1);
};
try {
  const title = createRadioTitle(audio, () => enabled, () => spectrum);
  idle();
  fire('playing');
  idle();
  playing();
  const first = document.title;
  tick();
  assert.equal(document.title, first, 'Unchanged audio never cycles through a decorative pattern');
  spectrum.bins.fill(220);
  tick();
  assert.notEqual(document.title, first, 'Column heights follow the audio energy');
  spectrum.bins.fill(0);
  tick();
  assert.equal(document.title, 'Портфолио', 'A silent passage has no dancing bars');
  spectrum.bins.fill(80);
  fire('playing');
  assert.equal(intervals.size, 1, 'Repeated playing events never duplicate timers');
  enabled = false;
  title.stop();
  idle();
  fire('playing');
  idle();
  for (const event of ['pause', 'ended', 'waiting', 'error']) {
    playing();
    fire(event);
    idle();
  }
  playing();
  audio.paused = true;
  tick();
  idle();
  playing();
  enabled = false;
  tick();
  idle();
  playing();
  window.dispatchEvent(new Event('pagehide'));
  idle();
} finally {
  globalThis.setInterval = originalInterval;
  globalThis.clearInterval = originalClear;
  delete globalThis.document;
  delete globalThis.window;
}
console.log('Validated live spectrum bands, silence, amplitude response, playback gating and timer cleanup.');
