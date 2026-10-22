import { queryAll, scheduleFrame } from '../core/dom.js';
import { reducedMotion } from '../core/media.js';
import { cardElements } from './cards.js';
import { placeMasonryCards } from './masonry.js';

/** DOM measurement only; column placement is kept in the pure masonry module. */
export function createPortfolioLayout(grid, model) {
  let cards = [];
  let assignments = new Map();
  let columnCount = 0;
  let gridWidth = 0;

  function reflow() {
    const styles = getComputedStyle(grid);
    const columns = Number(styles.getPropertyValue('--portfolio-columns')) || 1;
    const columnGap = parseFloat(styles.getPropertyValue('--portfolio-column-gap')) || 0;
    const rowGap = parseFloat(styles.getPropertyValue('--portfolio-row-gap')) || 0;
    const width = (grid.clientWidth - columnGap * (columns - 1)) / columns;
    if (width <= 0) return;
    if (columns !== columnCount) assignments.clear();
    columnCount = columns;

    // Batch each set of writes and reads instead of flushing once per card.
    cards.forEach((card) => card.style.setProperty('--card-width', `${width}px`));
    const mediaSizes = cards.map((card) => {
      const slide = model.getProject(card.dataset.project).slides[Number(card.dataset.slide)];
      const image = cardElements(card).open.querySelector(':scope > img');
      const ratio = image?.naturalWidth ? image.naturalWidth / image.naturalHeight : slide.ratio;
      return { card, height: Math.max(120, width / ratio) };
    });
    mediaSizes.forEach(({ card, height }) => {
      card.style.setProperty('--media-height', `${height}px`);
    });
    const items = cards.map((card) => ({ id: card.dataset.project, height: card.offsetHeight }));
    const layout = placeMasonryCards(items, { columns, width, columnGap, rowGap }, assignments);
    assignments = layout.assignments;
    layout.positions.forEach(({ x, y }, index) => {
      cards[index].style.setProperty('--card-x', `${x}px`);
      cards[index].style.setProperty('--card-y', `${y}px`);
    });
    grid.style.height = `${layout.height}px`;
  }

  const schedule = scheduleFrame(reflow);
  const resizeObserver = new ResizeObserver((entries) => {
    const changed = entries.some(({ target, contentRect }) => {
      if (target !== grid) return true;
      if (contentRect.width === gridWidth) return false;
      gridWidth = contentRect.width;
      return true;
    });
    if (changed) schedule();
  });

  function mutate(action, { animate = true } = {}) {
    const before = animate && !reducedMotion.matches
      ? new Map(cards.map((card) => [card.dataset.project, card.getBoundingClientRect()]))
      : null;
    cards.forEach((card) => card.getAnimations().forEach((animation) => animation.cancel()));
    action();
    const nextCards = queryAll('.project-card', grid);
    if (cards.length !== nextCards.length || cards.some((card, index) => card !== nextCards[index])) {
      assignments.clear();
      resizeObserver.disconnect();
      resizeObserver.observe(grid);
      nextCards.forEach((card) => resizeObserver.observe(card));
    }
    cards = nextCards;
    reflow();
    if (!before) return;
    cards.forEach((card) => {
      const old = before.get(card.dataset.project);
      if (!old) return;
      const next = card.getBoundingClientRect();
      const x = old.left - next.left;
      const y = old.top - next.top;
      if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) return;
      card.animate([{ transform: `translate(${x}px,${y}px)` }, { transform: 'none' }], {
        duration: 450,
        easing: 'cubic-bezier(.22,.8,.24,1)',
      });
    });
  }

  grid.addEventListener('load', schedule, true);
  grid.addEventListener('loadedmetadata', schedule, true);
  document.fonts.ready.then(schedule);
  return { mutate };
}
