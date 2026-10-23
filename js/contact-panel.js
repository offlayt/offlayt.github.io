import { query, queryAll } from './core/dom.js';
import { createDialog } from './core/dialog.js';
import { initFloatingContacts } from './contacts/floating.js';
import { reducedMotion } from './core/media.js';
import { telephonePlacement } from './contacts/placement.js';

const dialog = query('#contact-dialog');
if (dialog) {
  const triggers = queryAll('[data-contact]');
  const floating = query('.floating-social');
  const channels = queryAll('[data-contact-channel]', dialog);
  const leaf = query('.contact-leaf', dialog);
  const consult = query('.consult');
  let lastTrigger;
  let openingRevision = 0;
  initFloatingContacts(floating, consult, query('.hero'));

  function placeTelephone() {
    if (!dialog.classList.contains('is-consult') || !lastTrigger) return;
    const consultRect = consult && !consult.hidden ? consult.getBoundingClientRect() : null;
    const placement = telephonePlacement(
      consultRect, lastTrigger.getBoundingClientRect(),
      document.documentElement.clientWidth, window.innerHeight,
      query('.contact-furniture', dialog).getBoundingClientRect().width,
    );
    dialog.style.setProperty('--consult-x', placement.x + 'px');
    dialog.style.setProperty('--consult-bottom', placement.bottom + 'px');
  }
  const modal = createDialog(dialog, {
    closeDuration: 650,
    onOpen() {
      const revision = ++openingRevision;
      const consultation = dialog.classList.contains('is-consult');
      // Keep the consultation button underneath the falling furniture.
      floating?.classList.toggle('is-open', !consultation);
      dialog.classList.remove('is-ready');
      placeTelephone();
      leaf.inert = !reducedMotion.matches;
      if (consultation) {
        const images = queryAll('.contact-furniture img', dialog);
        images.forEach(image => { image.loading = 'eager'; });
        Promise.all(images.map(image => image.decode().catch(() => {}))).then(() => {
          if (revision === openingRevision && dialog.open && !dialog.classList.contains('is-closing')) dialog.classList.add('is-ready');
        });
      }
    },
    onClosing() {
      openingRevision++;
      leaf.style.setProperty('--book-close-from', getComputedStyle(leaf).transform);
      leaf.inert = true;
    },
    onClose() {
      openingRevision++;
      floating?.classList.remove('is-open');
      triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
      if (lastTrigger?.closest('dialog:not([open])')) query('.burger')?.focus();
    },
  });
  leaf.addEventListener('animationend', event => {
    if (event.animationName === 'contact-page-open' || event.animationName === 'contact-note-right') leaf.inert = false;
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) leaf.inert = false;
  });
  window.addEventListener('resize', placeTelephone);
  dialog.addEventListener('click', event => {
    if (dialog.classList.contains('is-consult')) {
      if (!event.target.closest('a[data-contact-channel]')) modal.close();
      return;
    }
    if (event.target === dialog || event.target.matches('.contact-stage')) modal.close();
  });
  triggers.forEach(trigger => {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', 'contact-dialog');
    trigger.setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-contact]');
    if (!trigger) return;
    lastTrigger = trigger;
    const consultation = Boolean(trigger.closest('.floating-social'));
    dialog.classList.toggle('is-consult', consultation);
    dialog.classList.toggle('is-book', !consultation);
    query('#contact-title', dialog).textContent = consultation ? 'Алло, есть идея?' : 'Телефонная книжка';
    channels.forEach(link => link.classList.toggle('is-channel', link.dataset.contactChannel === trigger.dataset.channel));
    modal.open();
    triggers.forEach(button => button.setAttribute('aria-expanded', String(button === trigger)));
  });
}
