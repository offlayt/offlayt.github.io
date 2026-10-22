import { radioTracks } from '../data/radio-tracks.js';

/** User-powered radio: a finite playlist, valve hiss and gentle fades. */
export function initRoomRadio(tracks = radioTracks) {
  const button = document.querySelector('.radio-button');
  const audio = document.querySelector('.radio-audio');
  if (!button || !audio) return;

  let graph;
  let enabled = false;
  let stopTimer;
  let revision = 0;
  let trackIndex = 0;
  audio.loop = false;

  function createGraph() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);

    const highpass = context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 180;
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3800;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.ratio.value = 3;
    const music = context.createMediaElementSource(audio);
    music.connect(highpass).connect(lowpass).connect(compressor).connect(master);

    // A seamless, very quiet analogue noise bed; no sound exists before a click.
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1400;
    noiseFilter.Q.value = 0.5;
    const noiseGain = context.createGain();
    noiseGain.gain.value = 0.018;
    noise.connect(noiseFilter).connect(noiseGain).connect(master);
    noise.start();
    return { context, master };
  }

  function paint() {
    button.classList.toggle('is-playing', enabled);
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Выключить радио' : 'Включить радио');
  }

  function playTrack(currentRevision) {
    if (audio.getAttribute('src') !== tracks[trackIndex] || audio.ended || audio.error) {
      audio.src = tracks[trackIndex];
    }
    // Both calls originate from the click on first start (including on mobile).
    Promise.all([graph.context.resume(), audio.play()]).catch(() => {
      if (enabled && currentRevision === revision) setEnabled(false);
    });
  }

  function setEnabled(next) {
    if (next && !tracks.length) return;
    try {
      graph ||= createGraph();
    } catch {
      return;
    }
    if (!graph) return;
    enabled = next;
    const currentRevision = ++revision;
    clearTimeout(stopTimer);
    paint();
    const { context, master } = graph;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(enabled ? 0.16 : 0, now + (enabled ? 1.4 : 0.7));

    if (enabled) {
      playTrack(currentRevision);
    } else {
      stopTimer = setTimeout(() => {
        if (enabled) return;
        audio.pause();
        context.suspend().catch(() => {});
      }, 750);
    }
  }

  button.addEventListener('click', () => setEnabled(!enabled));
  audio.addEventListener('ended', () => {
    if (!enabled) return;
    trackIndex++;
    if (trackIndex < tracks.length) {
      playTrack(++revision);
    } else {
      trackIndex = 0;
      setEnabled(false);
    }
  });
  audio.addEventListener('error', () => {
    if (enabled) setEnabled(false);
  });
  window.addEventListener('pagehide', () => {
    clearTimeout(stopTimer);
    enabled = false;
    revision++;
    audio.pause();
    if (graph) {
      graph.master.gain.cancelScheduledValues(graph.context.currentTime);
      graph.master.gain.value = 0;
      graph.context.suspend().catch(() => {});
    }
    paint();
  });
}
