import { queryAll } from '../core/dom.js';
import { wrapIndex } from '../core/math.js';
import { reducedMotion } from '../core/media.js';
import { keepSilent, pauseMedia } from './media.js';

/** One observer and clock for all cards; hidden and replaced media never keep playing. */
export function createCardPlayback(grid, model, changeSlide) {
  const states = new Map();
  let modalOpen = false;
  const delay = 6500;
  const stateFor = (card) => states.get(card);

  function sync(card) {
    const state = stateFor(card);
    if (!state) return;
    const video = card.querySelector('video');
    if (!video) return;
    if (state.video !== video) {
      state.video = video;
      keepSilent(video);
    }
    const shouldPlay = state.visible && !state.paused && !modalOpen
      && !document.hidden && !reducedMotion.matches;
    if (shouldPlay) video.play().catch((error) => {
      if (stateFor(card) !== state || state.video !== video || error.name === 'AbortError') return;
      // Autoplay can be denied; the card's play button remains available.
      state.paused = true;
      paintPause(card);
    });
    else video.pause();
  }

  function paintPause(card) {
    const state = stateFor(card);
    const button = card.querySelector('[data-video-toggle]');
    button.textContent = state.paused ? '▶' : 'Ⅱ';
    button.setAttribute('aria-pressed', String(state.paused));
    const project = model.getProject(card.dataset.project);
    button.setAttribute('aria-label', `${state.paused ? 'Включить' : 'Приостановить'} видео — ${project.name}`);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      const state = stateFor(target);
      if (!state) return;
      state.visible = isIntersecting;
      state.due = performance.now() + delay;
      sync(target);
    });
  }, { threshold: 0.05 });

  const syncAll = () => {
    states.forEach((state, card) => {
      state.due = performance.now() + delay;
      sync(card);
    });
  };
  document.addEventListener('visibilitychange', syncAll);
  reducedMotion.addEventListener('change', syncAll);
  new MutationObserver(() => {
    modalOpen = Boolean(document.querySelector('dialog[open]'));
    syncAll();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  grid.addEventListener('pointerover', (event) => {
    const card = event.target.closest('.project-card');
    if (stateFor(card)) stateFor(card).hovered = true;
  });
  grid.addEventListener('pointerout', (event) => {
    const card = event.target.closest('.project-card');
    const state = stateFor(card);
    if (!state || card.contains(event.relatedTarget)) return;
    state.hovered = false;
    state.due = performance.now() + delay;
  });
  grid.addEventListener('focusout', (event) => {
    const state = stateFor(event.target.closest('.project-card'));
    if (state) state.due = performance.now() + delay;
  });

  setInterval(() => {
    if (document.hidden || modalOpen || reducedMotion.matches) return;
    const now = performance.now();
    states.forEach((state, card) => {
      if (!state.visible || state.hovered || card.contains(document.activeElement) || now < state.due) return;
      const project = model.getProject(card.dataset.project);
      const indices = model.slideIndices(project);
      // A playing or manually paused video stays selected until the visitor moves on.
      if (project.slides[Number(card.dataset.slide)].video || indices.length < 2) return;
      const position = indices.indexOf(Number(card.dataset.slide));
      changeSlide(card, project, indices[wrapIndex(position + 1, indices.length)], indices);
    });
  }, 500);

  return {
    reset() {
      observer.disconnect();
      states.forEach((_, card) => pauseMedia(card));
      states.clear();
      queryAll('.project-card', grid).forEach((card, index) => {
        states.set(card, { visible: false, hovered: false, paused: reducedMotion.matches,
          due: performance.now() + delay + index * 160 });
        observer.observe(card);
        paintPause(card);
      });
    },
    changed(card) {
      const state = stateFor(card);
      if (!state) return;
      state.due = performance.now() + delay;
      state.paused = reducedMotion.matches;
      paintPause(card);
      sync(card);
    },
    toggle(card) {
      const state = stateFor(card);
      if (!state || !card.querySelector('video')) return;
      state.paused = !state.paused;
      paintPause(card);
      const video = card.querySelector('video');
      if (!state.paused) {
        keepSilent(video);
        // A deliberate click may play even when reduced motion disables autoplay.
        video.play().catch((error) => {
          if (stateFor(card) !== state || error.name === 'AbortError') return;
          state.paused = true;
          paintPause(card);
        });
      } else video.pause();
    },
  };
}
