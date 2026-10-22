import { escapeHtml, queryAll } from '../core/dom.js';

export function mediaMarkup(slide, { controls = false } = {}) {
  const title = escapeHtml(slide.title);
  const source = escapeHtml(slide.src);
  const loading = controls ? 'eager' : 'lazy';
  if (slide.images) {
    return `<div class="media-spread" role="img" aria-label="${title}"
      data-ratio="${slide.ratio}" style="--spread-ratio:${slide.ratio}">
      ${slide.images.map((src) => `<img src="${escapeHtml(src)}" alt="" loading="${loading}" draggable="false">`).join('')}
    </div>`;
  }
  if (slide.presentation === 'clinic-brand') {
    return `<div class="clinic-art"><span class="clinic-art__mark">
      <img src="${source}" alt="${title}" loading="${loading}"></span>
      <strong>Клиника<br>Здоровья</strong></div>`;
  }
  if (slide.video) {
    const behavior = controls ? 'muted playsinline loop controls preload="metadata"'
      : 'muted playsinline loop preload="none"';
    const poster = slide.poster ? `poster="${escapeHtml(slide.poster)}"` : '';
    return `<video ${behavior} ${poster} src="${source}" aria-label="${title}"></video>`;
  }
  return `<img src="${source}" alt="${title}" loading="${loading}">`;
}

/** Keep portfolio playback silent, including changes through native controls. */
const silentVideos = new WeakSet();

export function keepSilent(video) {
  if (silentVideos.has(video)) return;
  silentVideos.add(video);
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  video.addEventListener('volumechange', () => {
    if (!video.muted) video.muted = true;
    if (video.volume !== 0) video.volume = 0;
  });
}

export function pauseMedia(root) {
  queryAll('video', root).forEach((video) => video.pause());
}
