import { queryAll } from './core/dom.js';
import { reducedMotion } from './core/media.js';

/** Reveal each surface once. Grid transforms remain free for the portfolio layout. */
export function initScrollReveal() {
  if (reducedMotion.matches) return;
  const observed = new WeakSet();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.add('is-revealed');
        setTimeout(() => target.classList.remove('reveal-ready', 'is-revealed'), 1100);
        observer.unobserve(target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
  );

  function register() {
    queryAll(
      '.section-heading, .web-deck, .design-card, .project-media, .project-caption, .outro-copy, .retro-tv, .footer-bottom',
    ).forEach((element, index) => {
      if (observed.has(element)) return;
      observed.add(element);
      element.style.setProperty('--entry-x', `${index % 2 ? 110 : -110}px`);
      element.style.setProperty('--entry-turn', `${index % 2 ? 2 : -2}deg`);
      element.classList.add('reveal-ready');
      observer.observe(element);
    });
  }
  register();
  // Filtering already animates through the portfolio layout. Reapplying the
  // entrance animation would move clickable media while visitors select it.
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    observer.disconnect();
    queryAll('.reveal-ready').forEach((element) => element.classList.add('is-revealed'));
  });
}
