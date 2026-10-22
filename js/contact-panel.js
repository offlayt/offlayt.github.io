import { query, queryAll } from './core/dom.js';
import { mobileViewport, reducedMotion } from './core/media.js';
import { createDialog } from './core/dialog.js';
import { initFloatingContacts } from './contacts/floating.js';

const dialog = query('#contact-dialog');
if (dialog) {
  const triggers = queryAll('[data-contact]');
  const channels = queryAll('[data-contact-channel]', dialog);
  let lastTrigger;
  const floating = query('.floating-social');
  const consult = query('.consult');
  const hero = query('.hero');
  initFloatingContacts(floating, consult, hero);
  const handle = query('.contact-handle', dialog);
  const content = query('.contact-content', dialog);
  let sourceRect;
  let animations = [];

  function animateSheet(closing = false) {
    animations.forEach((animation) => animation.cancel());
    animations = [];
    if (!dialog.classList.contains('from-floating') || reducedMotion.matches) return;
    const options = {
      duration: closing ? 260 : 540,
      easing: 'cubic-bezier(.22,.8,.24,1)',
      fill: 'both',
    };
    if (!dialog.classList.contains('without-consult')) {
      const target = handle.getBoundingClientRect();
      const collapsed = `translateY(${sourceRect.top - target.top}px)`;
      animations.push(
        handle.animate(
          closing
            ? [{ transform: 'none' }, { transform: collapsed }]
            : [{ transform: collapsed }, { transform: 'none' }],
          options,
        ),
      );
    }
    const hidden = {
      clipPath: 'inset(100% 0 0 round 24px)',
      opacity: 0,
      transform: 'translateY(24px)',
    };
    const shown = { clipPath: 'inset(0 0 0 round 24px)', opacity: 1, transform: 'translateY(0)' };
    animations.push(content.animate(closing ? [shown, hidden] : [hidden, shown], options));
  }
  const modal = createDialog(dialog, {
    onOpen() {
      floating?.classList.toggle('is-open', dialog.classList.contains('from-floating'));
      animateSheet();
    },
    onClosing: () => animateSheet(true),
    onClose() {
      animations.forEach((animation) => animation.cancel());
      floating?.classList.remove('is-open');
      triggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
      if (lastTrigger?.closest('dialog:not([open])')) query('.burger')?.focus();
    },
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && dialog.classList.contains('from-floating')) modal.close();
  });

  triggers.forEach((trigger) => {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', 'contact-dialog');
    trigger.setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-contact]');
    if (!trigger) return;
    lastTrigger = trigger;
    const compact = floating?.classList.contains('is-compact');
    sourceRect = (consult && !compact ? consult : trigger).getBoundingClientRect();
    dialog.classList.toggle('without-consult', Boolean(compact));
    dialog.classList.toggle(
      'from-floating',
      mobileViewport.matches && Boolean(trigger.closest('.floating-social')),
    );
    channels.forEach((link) =>
      link.classList.toggle('is-channel', link.dataset.contactChannel === trigger.dataset.channel),
    );
    modal.open();
    triggers.forEach((button) => button.setAttribute('aria-expanded', String(button === trigger)));
  });
}
