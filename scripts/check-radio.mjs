import assert from 'node:assert/strict';
import { initRoomRadio } from '../js/footer/radio.js';

class Element extends EventTarget {
  attributes = new Map();
  classList = { toggle() {} };
  setAttribute(key, value) { this.attributes.set(key, value); }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  fire(type) { this.dispatchEvent(new Event(type)); }
}
class Audio extends Element {
  paused = true;
  ended = false;
  error = null;
  plays = [];
  set src(value) { this.setAttribute('src', value); this.ended = false; this.error = null; }
  play() { this.paused = false; this.plays.push(this.getAttribute('src')); return this.pending || Promise.resolve(); }
  pause() { this.paused = true; }
  finish() { this.ended = true; this.paused = true; this.fire('ended'); }
}
function node() {
  return {
    gain: { value: 0, cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime() {} },
    frequency: {}, Q: {}, threshold: {}, ratio: {},
    connect() { return this; }, start() {},
  };
}
class Context {
  sampleRate = 8;
  currentTime = 0;
  createGain = node;
  createBiquadFilter = node;
  createDynamicsCompressor = node;
  createMediaElementSource = node;
  createBufferSource = node;
  createAnalyser() { return { ...node(), frequencyBinCount: 256, getByteFrequencyData: bins => bins.fill(0) }; }
  createBuffer() { return { getChannelData: () => new Float32Array(16) }; }
  resume() { return Promise.resolve(); }
  suspend() { this.suspended = true; return Promise.resolve(); }
}
const timers = new Map();
const originalTimeout = globalThis.setTimeout;
const originalClear = globalThis.clearTimeout;
globalThis.setTimeout = callback => { const key = Symbol(); timers.set(key, callback); return key; };
globalThis.clearTimeout = key => timers.delete(key);
function finishFade() { for (const [key, callback] of timers) { timers.delete(key); callback(); } }
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
function setup(tracks = ['first.mp3', 'second.mp3']) {
  finishFade();
  const button = new Element();
  const audio = new Audio();
  const page = new Element();
  page.AudioContext = Context;
  globalThis.window = page;
  globalThis.document = { querySelector: selector => selector === '.radio-button' ? button : audio };
  initRoomRadio(tracks);
  return { button, audio, page, on: () => button.getAttribute('aria-pressed') === 'true' };
}
try {
  let radio = setup();
  assert.equal(radio.audio.plays.length, 0, 'No music or fetch before a click');
  radio.button.fire('click');
  await flush();
  assert.equal(radio.on(), true);
  assert.deepEqual(radio.audio.plays, ['first.mp3']);
  assert.equal(radio.audio.loop, false);
  radio.audio.finish();
  await flush();
  assert.deepEqual(radio.audio.plays, ['first.mp3', 'second.mp3'], 'End advances to the next track');
  assert.equal(radio.on(), true);
  radio.audio.finish();
  assert.equal(radio.on(), false, 'Last track switches off the indicator');
  finishFade();
  assert.equal(radio.audio.paused, true);
  radio.button.fire('click');
  await flush();
  assert.equal(radio.audio.plays.at(-1), 'first.mp3', 'New click restarts an exhausted playlist');
  radio.button.fire('click');
  radio.audio.finish();
  finishFade();
  assert.equal(radio.audio.plays.length, 3, 'An end during manual fade-out never advances');
  assert.equal(radio.audio.paused, true);

  radio = setup(['only.mp3']);
  radio.button.fire('click');
  radio.audio.finish();
  finishFade();
  assert.equal(radio.on(), false, 'A single track also switches off');
  assert.equal(radio.audio.plays.length, 1, 'Single track never loops');

  radio = setup();
  radio.audio.pending = Promise.reject(new Error('Playback denied'));
  radio.button.fire('click');
  await flush();
  assert.equal(radio.on(), false, 'Rejected playback cannot leave hiss and indicator running');
  finishFade();
  assert.equal(radio.audio.paused, true);

  radio = setup();
  let rejectOldPlay;
  radio.audio.pending = new Promise((_, reject) => { rejectOldPlay = reject; });
  radio.button.fire('click');
  radio.button.fire('click');
  radio.audio.pending = null;
  radio.button.fire('click');
  rejectOldPlay(new Error('Cancelled start'));
  await flush();
  finishFade();
  assert.equal(radio.on(), true, 'Stale play rejection cannot switch off a new session');
  assert.equal(radio.audio.paused, false, 'Rapid off/on cancels the delayed pause');
  radio.audio.error = { code: 4 };
  radio.audio.fire('error');
  finishFade();
  assert.equal(radio.on(), false, 'A media loading error turns the radio off');
  radio.button.fire('click');
  radio.page.fire('pagehide');
  assert.equal(radio.on(), false);
  assert.equal(radio.audio.paused, true, 'Leaving the page stops playback immediately');

  radio = setup([]);
  radio.button.fire('click');
  assert.equal(radio.on(), false);
  assert.equal(radio.audio.plays.length, 0, 'Empty playlist never starts hiss-only playback');
} finally {
  finishFade();
  globalThis.setTimeout = originalTimeout;
  globalThis.clearTimeout = originalClear;
  delete globalThis.window;
  delete globalThis.document;
}
console.log('Validated radio start, playlist advance/exhaustion, toggle races, playback errors and page exit.');
