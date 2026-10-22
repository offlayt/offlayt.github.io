import { query, queryAll } from '../core/dom.js';
import { reducedMotion } from '../core/media.js';
import { createDialog } from '../core/dialog.js';
import { initActiveSection } from './active-section.js';

export function initNavigation() {
  initActiveSection();
  const navigation = query('#navigation');
  const burger = query('.burger');
  const door = query('.wardrobe-door', navigation);
  const drawer = createDialog(navigation, {
    closeDuration: 700,
    onOpen() {
      burger.setAttribute('aria-expanded', 'true');
      door.inert = !reducedMotion.matches;
    },
    onClosing() {
      door.style.setProperty('--wardrobe-close-from', getComputedStyle(door).transform);
      door.inert = true;
    },
    onClose: () => burger.setAttribute('aria-expanded', 'false'),
  });
  door.addEventListener('animationend', (event) => {
    if (event.animationName === 'wardrobe-open') door.inert = false;
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) door.inert = false;
  });
  burger.addEventListener('click', drawer.open);
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('.wardrobe-door')) return;
    // Inert content is retargeted to its parent while the door is swinging.
    if (door.inert) {
      const rect = door.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (inside) return;
    }
    drawer.close();
  });
  queryAll('a[href^="#"]', navigation).forEach((link) => {
    link.addEventListener('click', drawer.close);
  });
}
