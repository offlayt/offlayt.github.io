import { reducedMotion } from '../core/media.js';

/** Collapse the consultation pill while the social buttons keep their right edge. */
export function initFloatingContacts(floating, consult, hero) {
  if (!consult) return;
  let timer;
  let visible;

  function update(next, immediate = false) {
    if (visible === next) return;
    visible = next;
    clearTimeout(timer);
    consult.inert = !next;
    consult.setAttribute('aria-hidden', String(!next));
    if (next) {
      consult.hidden = false;
      // Commit the collapsed size before expanding on a return to the hero.
      void consult.offsetWidth;
      floating.classList.remove('is-compact');
    } else {
      floating.classList.add('is-compact');
      if (immediate || reducedMotion.matches) consult.hidden = true;
      else
        timer = setTimeout(() => {
          consult.hidden = true;
        }, 650);
    }
  }

  update(Boolean(hero && hero.getBoundingClientRect().bottom > 72), true);
  if (hero) {
    new IntersectionObserver(([entry]) => update(entry.isIntersecting), {
      rootMargin: '-72px 0px 0px',
    }).observe(hero);
  }
}
