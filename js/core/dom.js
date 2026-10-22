export const query = (selector, root = document) => root.querySelector(selector);
export const queryAll = (selector, root = document) => [...root.querySelectorAll(selector)];

export function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );
}

/** Combine repeated resize/observer requests into one task per browser frame. */
export function scheduleFrame(callback) {
  let frame = 0;
  return (...args) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      callback(...args);
    });
  };
}
