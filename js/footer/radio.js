/** User-powered radio: quiet band-limited music, valve hiss and gentle fades. */
export function initRoomRadio() {
  const button = document.querySelector('.radio-button');
  const audio = document.querySelector('.radio-audio');
  if (!button || !audio) return;

  let graph;
  let enabled = false;
  let stopTimer;
  let revision = 0;

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

  function setEnabled(next) {
    graph ||= createGraph();
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
      context.resume().then(() => {
        if (!enabled || currentRevision !== revision) return;
        // The user will supply the music later. Empty configuration plays only
        // tuning hiss and never requests a nonexistent MP3 from the server.
        const source = button.dataset.radioSrc;
        if (!source) return;
        if (!audio.getAttribute('src')) audio.src = source;
        audio.play().catch(() => {});
      }).catch(() => {
        if (currentRevision === revision) setEnabled(false);
      });
    } else {
      stopTimer = setTimeout(() => {
        if (enabled) return;
        audio.pause();
        context.suspend();
      }, 750);
    }
  }

  button.addEventListener('click', () => setEnabled(!enabled));
  window.addEventListener('pagehide', () => {
    clearTimeout(stopTimer);
    enabled = false;
    revision++;
    audio.pause();
    graph?.context.suspend();
    paint();
  });
}
