import { query, scheduleFrame } from '../core/dom.js';

export function heroIsCurrent(rect, marker) {
  return rect.top <= marker && rect.bottom > marker;
}

/** Use the same header boundary as navigation, including on an anchored page load. */
export function initHeroPower(lamps) {
  const hero = query('.hero');
  const header = query('.header');
  if (!hero || !lamps.length) return;
  const update = () => {
    const active = heroIsCurrent(hero.getBoundingClientRect(), (header?.getBoundingClientRect().bottom || 0) + 24);
    lamps.forEach((lamp) => lamp.setHeroActive(active));
  };
  const schedule = scheduleFrame(update);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  const resize = new ResizeObserver(schedule);
  [hero, header].filter(Boolean).forEach((element) => resize.observe(element));
  document.fonts.ready.then(schedule);
  update();
}
