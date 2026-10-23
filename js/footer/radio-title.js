// One narrow braille column per band, rising from the baseline.
const columns = ['⠀', '⡀', '⡄', '⡆', '⡇'];
const bandEdges = [140, 240, 400, 650, 1000, 1500, 2200, 3100, 4300];

export function spectrumBars({ bins, sampleRate, fftSize }) {
  const hzPerBin = sampleRate / fftSize;
  return bandEdges.slice(0, -1).map((low, index) => {
    const first = Math.max(1, Math.floor(low / hzPerBin));
    const last = Math.min(bins.length, Math.max(first + 1, Math.ceil(bandEdges[index + 1] / hzPerBin)));
    let total = 0;
    for (let bin = first; bin < last; bin++) total += bins[bin];
    const energy = total / Math.max(1, last - first);
    const level = Math.max(0, Math.min(4, Math.round((energy - 24) / 231 * 4)));
    return columns[level];
  }).join('');
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
    const bars = spectrum ? spectrumBars(spectrum) : '';
    document.title = bars.replaceAll('⠀', '') ? `${bars} · ${idleTitle}` : idleTitle;
  }

  function start() {
    if (interval !== undefined || !isEnabled() || audio.paused || audio.ended) return;
    tick();
    interval = setInterval(tick, 150);
  }

  audio.addEventListener('playing', start);
  for (const event of ['pause', 'ended', 'waiting', 'error']) audio.addEventListener(event, stop);
  window.addEventListener('pagehide', stop);
  return { stop };
}
