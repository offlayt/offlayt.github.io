import { scheduleFrame } from '../core/dom.js';

/** Retract before the room fills the viewport, with more lead time on phones. */
export function shouldRetractLamp(scrollY, viewportHeight, pageHeight, retracted = false, viewportWidth = 1280) {
  if (pageHeight <= viewportHeight + 1) return false;
  const remaining = Math.max(0, pageHeight - viewportHeight - scrollY);
  const lead = viewportWidth <= 760 ? viewportHeight * 0.65 : viewportHeight * 0.22;
  return remaining <= lead + (retracted ? 64 : 0);
}

export function initEndRetraction(lamps) {
  const rigs = lamps.map(({ scene }) => ({ scene, rig: scene.querySelector('.lamp-rig') }))
    .filter(({ rig }) => rig);
  if (!rigs.length) return;
  let retracted = false;
  const update = () => {
    const root = document.scrollingElement || document.documentElement;
    const next = shouldRetractLamp(window.scrollY, root.clientHeight, root.scrollHeight, retracted, root.clientWidth);
    if (next === retracted) return;
    retracted = next;
    rigs.forEach(({ scene, rig }) => {
      scene.classList.toggle('is-retracted', retracted);
      rig.inert = retracted;
      rig.setAttribute('aria-hidden', String(retracted));
    });
  };
  const schedule = scheduleFrame(update);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  const resize = new ResizeObserver(schedule);
  resize.observe(document.body);
  document.fonts.ready.then(schedule);
  update();
}
