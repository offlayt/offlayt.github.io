import { query, queryAll, scheduleFrame } from '../core/dom.js';
import { mobileViewport } from '../core/media.js';
import { webCard } from './templates.js';

const TAB_OFFSET = 44;
const CARD_OVERLAP = 14;

/** Card selection and its description are deliberately separate actions. */
export function initWebDeck(services) {
  const deck = query('#web-deck');
  if (!deck || !services.length) return;
  deck.innerHTML = services.map(webCard).join('');
  const cards = queryAll('.web-card', deck).map((element) => ({
    element,
    button: query('.web-card-toggle', element),
    more: query('.web-detail-toggle', element),
    detail: query('.web-detail', element),
  }));
  let activeIndex = 0;
  let expanded = false;

  function arrange(index, expand = false) {
    activeIndex = index;
    expanded = expand;
    cards.forEach(({ element, button, more, detail }, cardIndex) => {
      const active = cardIndex === activeIndex;
      element.style.zIndex = String(cardIndex + 1);
      element.classList.toggle('is-active', active);
      element.classList.toggle('is-expanded', active && expanded);
      button.setAttribute('aria-pressed', String(active));
      more.hidden = !active;
      more.setAttribute('aria-expanded', String(active && expanded));
      more.setAttribute('aria-label', `${active && expanded ? 'Свернуть описание' : 'Подробнее'}: ${services[cardIndex].title}`);
      detail.inert = !(active && expanded);
      detail.hidden = !(active && expanded);
    });
    // Let the preview follow its text instead of pinning it to a fixed-height card.
    const detailHeight = mobileViewport.matches
      ? 450
      : Math.max(450, Math.min(540, innerHeight - 280));
    const cardHeight = expanded
      ? detailHeight
      : Math.max(360, Math.ceil(cards[activeIndex].button.getBoundingClientRect().height) + CARD_OVERLAP + 4);
    deck.style.setProperty('--web-card-height', `${cardHeight}px`);
    cards.forEach(({ element }, cardIndex) => {
      const offset = cardIndex <= activeIndex
        ? cardIndex * TAB_OFFSET
        : activeIndex * TAB_OFFSET + cardHeight - CARD_OVERLAP + (cardIndex - activeIndex - 1) * TAB_OFFSET;
      element.style.setProperty('--card-y', `${offset}px`);
    });
    deck.style.height = `${cardHeight + (cards.length - 1) * TAB_OFFSET + 12}px`;
  }

  cards.forEach(({ button, more }, index) => {
    button.addEventListener('click', () => {
      if (index !== activeIndex) arrange(index);
    });
    more.addEventListener('click', () => arrange(index, !expanded));
  });
  const resize = scheduleFrame(() => arrange(activeIndex, expanded));
  window.addEventListener('resize', resize, { passive: true });
  const observer = new ResizeObserver(resize);
  cards.forEach(({ button }) => observer.observe(button));
  document.fonts.ready.then(resize);
  arrange(0);
}
