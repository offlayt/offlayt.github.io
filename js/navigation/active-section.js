import { query, queryAll, scheduleFrame } from '../core/dom.js';

/** No selected link before the first content section, including on the hero. */
export function activeSectionId(sections, marker) {
  return sections.reduce((active, section) => section.top <= marker ? section.id : active, null);
}

export function initActiveSection() {
  const links = queryAll('.desktop-nav a');
  const sections = queryAll('#services, #portfolio');
  const header = query('.header');
  const update = scheduleFrame(() => {
    const active = activeSectionId(
      sections.map((section) => ({ id: section.id, top: section.getBoundingClientRect().top })),
      header.getBoundingClientRect().bottom + 24,
    );
    links.forEach((link) => {
      if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  const resize = new ResizeObserver(update);
  [header, ...sections].forEach((element) => resize.observe(element));
  document.fonts.ready.then(update);
  update();
}
