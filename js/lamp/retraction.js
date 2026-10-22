import { scheduleFrame } from '../core/dom.js';

/** Different entry/exit thresholds prevent jitter at the bottom scroll boundary. */
export function shouldRetractLamp(scrollY, viewportHeight, pageHeight, retracted = false) {
  if (pageHeight <= viewportHeight + 1) return false;
  const remaining = Math.max(0, pageHeight - viewportHeight - scrollY);
  return remaining <= (retracted ? 64 : 12);
}

export function initEndRetraction(lamps) {
  const rigs = lamps.map(({ scene }) => ({ scene, rig: scene.querySelector('.lamp-rig') }))
    .filter(({ rig }) => rig);
  if (!rigs.length) return;
  let retracted = false;
  const update = () => {
    const root = document.scrollingElement || document.documentElement;
    const next = shouldRetractLamp(window.scrollY, root.clientHeight, root.scrollHeight, retracted);
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
