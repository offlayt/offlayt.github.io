import { query, queryAll } from '../core/dom.js';
import { wrapIndex } from '../core/math.js';
import { createDialog } from '../core/dialog.js';
import { mediaMarkup, pauseMedia, keepSilent } from './media.js';
import { hasDetailedCase } from '../data/projects.js?v=20261023-new-works';
import { reducedMotion } from '../core/media.js';
import { createImageZoom } from './zoom.js';
import { initViewerDismiss } from './viewer-dismiss.js';

export function createWorkViewer(dialog) {
  const media = query('.viewer-media', dialog);
  const name = query('#viewer-project', dialog);
  const title = query('#viewer-title', dialog);
  const position = query('#viewer-position', dialog);
  const caseLink = query('#viewer-case', dialog);
  const zoom = createImageZoom(media, query('.viewer-zoom', dialog));
  const modal = createDialog(dialog, {
    onClosing: () => pauseMedia(dialog),
    onClose: () => { pauseMedia(dialog); media.replaceChildren(); },
  });
  initViewerDismiss(dialog, media, modal.close);
  let project;
  let slideIndex = 0;

  function render() {
    const slide = project.slides[slideIndex];
    pauseMedia(media);
    name.textContent = project.name;
    title.textContent = slide.title;
    media.innerHTML = mediaMarkup(slide, { controls: true });
    const video = media.querySelector('video');
    if (video) {
      keepSilent(video);
      if (!reducedMotion.matches) video.play().catch(() => {});
    }
    zoom.reset();
    position.textContent = `${slideIndex + 1} / ${project.slides.length}`;
    caseLink.hidden = !hasDetailedCase(project);
    if (hasDetailedCase(project)) caseLink.href = project.caseHref;
    else caseLink.removeAttribute('href');
    queryAll('[data-view-step]', dialog).forEach((button) => {
      button.hidden = project.slides.length < 2;
    });
  }

  function step(amount) {
    if (!project) return;
    slideIndex = wrapIndex(slideIndex + amount, project.slides.length);
    render();
  }
  queryAll('[data-view-step]', dialog).forEach((button) => {
    button.addEventListener('click', () => step(Number(button.dataset.viewStep)));
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.target.closest('video')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      step(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  return {
    open(selectedProject, index) {
      project = selectedProject;
      slideIndex = index;
      render();
      modal.open();
    },
  };
}
