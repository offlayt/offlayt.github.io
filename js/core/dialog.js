import { queryAll } from './dom.js';
import { reducedMotion } from './media.js';

// A controller is shared when several components use the same dialog.
const controllers = new WeakMap();

export function createDialog(
  dialog,
  { onOpen = () => {}, onClose = () => {}, onClosing = () => {}, closeDuration = 280 } = {},
) {
  if (controllers.has(dialog)) return controllers.get(dialog);
  let closeTimer;

  function finishClose() {
    clearTimeout(closeTimer);
    dialog.close();
    dialog.classList.remove('is-closing');
  }

  function open() {
    clearTimeout(closeTimer);
    queryAll('dialog[open]').forEach((other) => {
      if (other !== dialog) {
        const controller = controllers.get(other);
        if (controller) controller.finishClose();
        else other.close();
      }
    });
    dialog.classList.remove('is-closing');
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
    onOpen();
  }

  function close() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    onClosing();
    dialog.classList.add('is-closing');
    if (reducedMotion.matches) finishClose();
    else closeTimer = setTimeout(finishClose, closeDuration);
  }

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const outside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;
    if (outside) close();
  });
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    clearTimeout(closeTimer);
    dialog.classList.remove('is-closing');
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open');
    onClose();
  });
  queryAll('[data-close]', dialog).forEach((button) => button.addEventListener('click', close));

  const controller = { open, close, finishClose };
  controllers.set(dialog, controller);
  return controller;
}
