// Solid upright bars with a thin gap keep the spectrum legible in browser chrome.
const columns = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
const baseline = Array(8).fill(columns[0]).join(' ');
const bandEdges = [140, 240, 400, 650, 1000, 1500, 2200, 3100, 4300];

export function spectrumBars({ bins, sampleRate, fftSize }) {
  const hzPerBin = sampleRate / fftSize;
  return bandEdges.slice(0, -1).map((low, index) => {
    const first = Math.max(1, Math.floor(low / hzPerBin));
    const last = Math.min(bins.length, Math.max(first + 1, Math.ceil(bandEdges[index + 1] / hzPerBin)));
    let power = 0;
    let peak = 0;
    for (let bin = first; bin < last; bin++) {
      power += bins[bin] ** 2;
      peak = Math.max(peak, bins[bin]);
    }
    const energy = Math.sqrt(power / Math.max(1, last - first)) * 0.65 + peak * 0.35;
    const normalized = Math.max(0, Math.min(1, (energy - 28) / 170));
    const level = Math.round(normalized ** 0.85 * 7);
    return columns[level];
  }).join(' ');
}

/** A small text equalizer follows actual playback, including buffering and errors. */
export function createRadioTitle(audio, isEnabled = () => true, readSpectrum = () => null) {
  const idleTitle = document.title;
  let interval;

  function stop() {
    if (interval !== undefined) clearInterval(interval);
    interval = undefined;
    document.title = idleTitle;
  }

  function tick() {
    if (!isEnabled() || audio.paused || audio.ended) {
      stop();
      return;
    }
    const spectrum = readSpectrum();
    document.title = spectrum ? spectrumBars(spectrum) : baseline;
  }

  function start() {
    if (interval !== undefined || !isEnabled() || audio.paused || audio.ended) return;
    tick();
    interval = setInterval(tick, 100);
  }

  audio.addEventListener('playing', start);
  for (const event of ['pause', 'ended', 'waiting', 'error']) audio.addEventListener(event, stop);
  window.addEventListener('pagehide', stop);
  return { stop };
}
