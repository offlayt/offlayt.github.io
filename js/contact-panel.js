import { query, queryAll } from './core/dom.js';
import { createDialog } from './core/dialog.js';
import { initFloatingContacts } from './contacts/floating.js';

const dialog = query('#contact-dialog');
if (dialog) {
  const triggers = queryAll('[data-contact]');
  const floating = query('.floating-social');
  const channels = queryAll('[data-contact-channel]', dialog);
  let lastTrigger;
  initFloatingContacts(floating, query('.consult'), query('.hero'));
  const modal = createDialog(dialog, {
    closeDuration: 380,
    onOpen() { floating?.classList.add('is-open'); },
    onClose() {
      floating?.classList.remove('is-open');
      triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
      if (lastTrigger?.closest('dialog:not([open])')) query('.burger')?.focus();
    },
  });
  // Transparent space between the props also dismisses the dialog.
  dialog.addEventListener('click', event => {
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
