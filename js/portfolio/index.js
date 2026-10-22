import { query, queryAll } from '../core/dom.js';
import { wrapIndex } from '../core/math.js';
import { reducedMotion } from '../core/media.js';
import { projects, workTypes, typeColors } from '../data/projects.js';
import { createPortfolioModel } from './model.js';
import { projectCard, updateCard } from './cards.js';
import { createPortfolioLayout } from './layout.js';
import { createWorkViewer } from './viewer.js';
import { createCardPlayback } from './playback.js';

export function initPortfolio() {
  const grid = query('#project-grid');
  if (!grid) return;
  const search = query('#project-search');
  const filterGroup = query('#filters');
  const count = query('#project-count');
  const empty = query('.empty-state');
  const model = createPortfolioModel(projects);
  const layout = createPortfolioLayout(grid, model);
  const viewer = createWorkViewer(query('#work-viewer'));
  const playback = createCardPlayback(grid, model, changeSlide);

  function changeSlide(card, project, index, indices) {
    layout.mutate(() => updateCard(card, project, index, indices));
    playback.changed(card);
  }

  filterGroup.innerHTML = Object.entries(workTypes)
    .map(
      ([type, label]) => `
    <button class="filter" type="button" data-filter="${type}" style="--type-color:${typeColors[type]}" aria-pressed="${type === 'all'}">${label}</button>
  `,
    )
    .join('');
  const filters = queryAll('[data-filter]', filterGroup);

  function render() {
    const visible = model.visibleProjects();
    grid.innerHTML = visible
      .map((project) => projectCard(project, model.slideIndices(project)))
      .join('');
    count.textContent = `${visible.length} / ${projects.length}`;
    empty.hidden = visible.length > 0;
    playback.reset();
    filters.forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.filter === model.filter)),
    );
  }

  filterGroup.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    model.setFilter(button.dataset.filter);
    layout.mutate(render, { animate: false });
  });
  search.addEventListener('input', () => {
    model.setQuery(search.value);
    layout.mutate(render, { animate: false });
  });

  grid.addEventListener('click', (event) => {
    const card = event.target.closest('.project-card');
    if (!card) return;
    const project = model.getProject(card.dataset.project);
    const step = event.target.closest('[data-slide-step]');
    const tag = event.target.closest('[data-project-type]');
    if (step) {
      const indices = model.slideIndices(project);
      const current = indices.indexOf(Number(card.dataset.slide));
      const index = indices[wrapIndex(current + Number(step.dataset.slideStep), indices.length)];
      changeSlide(card, project, index, indices);
    } else if (tag) {
      const type = tag.dataset.projectType;
      if (model.filter !== 'all' && model.filter !== type) {
        model.setFilter('all');
        layout.mutate(render, { animate: false });
      }
      const target = query(`[data-project="${project.id}"]`, grid);
      const index = project.slides.findIndex((slide) => slide.types.includes(type));
      changeSlide(target, project, index, model.slideIndices(project));
    } else if (event.target.closest('[data-video-toggle]')) {
      playback.toggle(card);
    } else if (event.target.closest('.project-open')) {
      viewer.open(project, Number(card.dataset.slide));
    }
  });

  grid.addEventListener('keydown', (event) => {
    if (!event.target.closest('.project-open') || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const card = event.target.closest('.project-card');
    const project = model.getProject(card.dataset.project);
    const indices = model.slideIndices(project);
    if (indices.length < 2) return;
    event.preventDefault();
    const current = indices.indexOf(Number(card.dataset.slide));
    const index = indices[wrapIndex(current + (event.key === 'ArrowRight' ? 1 : -1), indices.length)];
    changeSlide(card, project, index, indices);
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-related]');
    if (!link) return;
    event.preventDefault();
    const project = model.getProject(link.dataset.related);
    if (!project) return;
    search.value = '';
    model.setQuery('');
    const type = link.dataset.relatedFilter;
    // An example must stay visible even when a service spans several work types.
    const supported = type === 'all' || project.slides.some((slide) => slide.types.includes(type));
    model.setFilter(supported ? type : 'all');
    layout.mutate(render, { animate: false });
    const card = query(`[data-project="${project.id}"]`, grid);
    if (!card) return;
    if (location.hash !== '#portfolio') history.pushState(null, '', '#portfolio');
    if (!reducedMotion.matches)
      card.animate([{ boxShadow: '0 0 0 3px #dfb669' }, { boxShadow: '0 0 0 0 transparent' }], {
        duration: 1800,
      });
    requestAnimationFrame(() => {
      card.scrollIntoView({
        behavior: reducedMotion.matches ? 'instant' : 'smooth',
        block: 'center',
      });
      query('.project-open', card).focus({ preventScroll: true });
    });
  });

  layout.mutate(render, { animate: false });
}
