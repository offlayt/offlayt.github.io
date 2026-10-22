import { query, queryAll, escapeHtml } from '../core/dom.js';
import { reducedMotion } from '../core/media.js';
import { workTypes, typeColors, hasDetailedCase } from '../data/projects.js';
import { mediaMarkup, pauseMedia } from './media.js';

const nodes = new WeakMap();

export function cardElements(card) {
  if (!nodes.has(card)) nodes.set(card, {
    media: query('.project-media', card),
    open: query('.project-open', card),
    position: query('.project-position', card),
    slideTitle: query('.project-slide-title', card),
    pause: query('[data-video-toggle]', card),
    tags: queryAll('[data-project-type]', card),
  });
  return nodes.get(card);
}

function videoToggle(project, slide) {
  return `<button type="button" data-video-toggle ${slide.video ? '' : 'hidden'}
    aria-label="Приостановить видео — ${escapeHtml(project.name)}" aria-pressed="false">Ⅱ</button>`;
}

export function projectCard(project, indices) {
  const index = indices[0];
  const slide = project.slides[index];
  const name = escapeHtml(project.name);
  const tags = project.types.map((type) => `<button type="button" data-project-type="${type}"
    style="--type-color:${typeColors[type]}" aria-pressed="${slide.types.includes(type)}"
    class="${slide.types.includes(type) ? 'is-selected' : ''}">${workTypes[type]}</button>`).join('');
  return `<article class="project-card light-surface" data-project="${project.id}" data-slide="${index}"
      style="--project-bg:${escapeHtml(project.color)}" aria-labelledby="project-${project.id}">
    <div class="project-media">
      <button class="project-open" type="button" aria-label="Открыть: ${name} — ${escapeHtml(slide.title)}">${mediaMarkup(slide)}</button>
    </div>
    ${hasDetailedCase(project) ? `<a class="project-details" href="${project.caseHref}"
      aria-label="Подробнее о проекте ${name}" title="Подробнее о проекте ${name}">...</a>` : ''}
    <div class="project-gallery-bar">
      <span class="project-slide-title">${escapeHtml(slide.title)}</span>
      <div class="project-controls">
        <button type="button" data-slide-step="-1" ${indices.length < 2 ? 'hidden' : ''} aria-label="Предыдущий материал — ${name}">←</button>
        <span class="project-position" ${indices.length < 2 ? 'hidden' : ''}>1 / ${indices.length}</span>
        <button type="button" data-slide-step="1" ${indices.length < 2 ? 'hidden' : ''} aria-label="Следующий материал — ${name}">→</button>
        ${videoToggle(project, slide)}
      </div>
    </div>
    <div class="project-caption">
      ${project.status ? `<span class="project-status">${escapeHtml(project.status)}</span>` : ''}
      <h3 id="project-${project.id}">${name}</h3>
      <div class="project-tags">${tags}</div>
      <p class="project-description">${escapeHtml(project.description)}</p>
    </div>
  </article>`;
}

export function updateCard(card, project, index, indices) {
  const slide = project.slides[index];
  const elements = cardElements(card);
  pauseMedia(elements.open);
  elements.media.classList.add('is-switching');
  card.dataset.slide = String(index);
  elements.open.innerHTML = mediaMarkup(slide);
  elements.open.setAttribute('aria-label', `Открыть: ${project.name} — ${slide.title}`);
  elements.slideTitle.textContent = slide.title;
  elements.position.textContent = `${Math.max(1, indices.indexOf(index) + 1)} / ${indices.length}`;
  elements.pause.hidden = !slide.video;
  elements.pause.setAttribute('aria-pressed', 'false');
  elements.pause.setAttribute('aria-label', `Приостановить видео — ${project.name}`);
  elements.pause.textContent = 'Ⅱ';
  elements.tags.forEach((tag) => {
    const selected = slide.types.includes(tag.dataset.projectType);
    tag.classList.toggle('is-selected', selected);
    tag.setAttribute('aria-pressed', String(selected));
  });
  if (!reducedMotion.matches) elements.open.animate(
    [{ opacity: 0.15 }, { opacity: 1 }], { duration: 650, easing: 'ease-out' },
  );
}
