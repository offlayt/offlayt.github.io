/** Visible pixels of object-fit: contain, including the image's current zoom/pan. */
export function containedMediaRect(box, width, height) {
  if (!width || !height) return box;
  const fit = Math.min(box.width / width, box.height / height);
  const visibleWidth = width * fit;
  const visibleHeight = height * fit;
  return {
    left: box.left + (box.width - visibleWidth) / 2,
    top: box.top + (box.height - visibleHeight) / 2,
    right: box.left + (box.width + visibleWidth) / 2,
    bottom: box.top + (box.height + visibleHeight) / 2,
  };
}

export function pointInside(rect, x, y) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function hitsMedia(viewport, x, y) {
  if (!pointInside(viewport.getBoundingClientRect(), x, y)) return false;
  const artwork = viewport.querySelector('.clinic-art');
  if (artwork && pointInside(artwork.getBoundingClientRect(), x, y)) return true;
  return [...viewport.querySelectorAll('img, video')].some((element) => {
    const box = element.getBoundingClientRect();
    const isVideo = element.tagName === 'VIDEO';
    // Native video controls can sit over the lower letterbox area.
    if (isVideo && element.controls && pointInside(box, x, y) && y >= box.bottom - 56) return true;
    return pointInside(containedMediaRect(
      box,
      isVideo ? element.videoWidth : element.naturalWidth,
      isVideo ? element.videoHeight : element.naturalHeight,
    ), x, y);
  });
}

export function initViewerDismiss(dialog, viewport, close) {
  const pointers = new Map();
  let dragged = false;
  dialog.addEventListener('pointerdown', (event) => {
    if (!pointers.size) dragged = false;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size > 1) dragged = true;
  }, true);
  dialog.addEventListener('pointermove', (event) => {
    const start = pointers.get(event.pointerId);
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) dragged = true;
  }, true);
  const release = (event) => pointers.delete(event.pointerId);
  dialog.addEventListener('pointerup', release, true);
  dialog.addEventListener('pointercancel', (event) => { dragged = true; release(event); }, true);
  dialog.addEventListener('close', () => { pointers.clear(); dragged = false; });
  dialog.addEventListener('click', (event) => {
    if (dragged || event.target.closest('button, a, input, select, textarea, [role="button"]')) return;
    if (!hitsMedia(viewport, event.clientX, event.clientY)) close();
  });
}
