import { clamp } from '../core/math.js';

/** Image-only zoom. Pointer capture keeps panning and pinching inside the viewer. */
export function createImageZoom(viewport, controls) {
  let image;
  let scale = 1;
  let x = 0;
  let y = 0;
  const pointers = new Map();
  let previous;

  function paint() {
    if (!image) return;
    const rect = viewport.getBoundingClientRect();
    // The base image fills the viewport with object-fit: contain.
    const width = image.naturalWidth || Number(image.dataset.ratio) * 1000 || rect.width;
    const height = image.naturalHeight || (image.dataset.ratio ? 1000 : rect.height);
    const fit = Math.min(rect.width / width, rect.height / height);
    const limitX = Math.max(0, (width * fit * scale - rect.width) / 2);
    const limitY = Math.max(
      0,
      (height * fit * scale - rect.height) / 2,
    );
    x = clamp(x, -limitX, limitX);
    y = clamp(y, -limitY, limitY);
    image.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    viewport.classList.toggle('is-zoomed', scale > 1);
    controls.querySelector('output').textContent = `${Math.round(scale * 100)}%`;
    controls.querySelector('[data-zoom="out"]').disabled = scale === 1;
    controls.querySelector('[data-zoom="in"]').disabled = scale === 5;
  }

  function zoom(value, clientX, clientY) {
    const next = clamp(value, 1, 5);
    if (clientX !== undefined) {
      const rect = viewport.getBoundingClientRect();
      const px = clientX - rect.left - rect.width / 2;
      const py = clientY - rect.top - rect.height / 2;
      x = px - (px - x) * (next / scale);
      y = py - (py - y) * (next / scale);
    }
    scale = next;
    paint();
  }

  controls.addEventListener('click', (event) => {
    const action = event.target.closest('[data-zoom]')?.dataset.zoom;
    if (action) zoom(action === 'reset' ? 1 : scale * (action === 'in' ? 1.5 : 1 / 1.5));
  });
  viewport.addEventListener(
    'wheel',
    (event) => {
      if (!image) return;
      event.preventDefault();
      zoom(scale * Math.exp(-event.deltaY * 0.002), event.clientX, event.clientY);
    },
    { passive: false },
  );
  viewport.addEventListener('dblclick', (event) => {
    if (image) zoom(scale > 1 ? 1 : 2.5, event.clientX, event.clientY);
  });

  function gesture() {
    const points = [...pointers.values()];
    if (!points.length) return null;
    return {
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
      distance:
        points.length > 1 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0,
    };
  }
  viewport.addEventListener('pointerdown', (event) => {
    if (!image || event.button > 0) return;
    event.preventDefault();
    viewport.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    previous = gesture();
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const next = gesture();
    x += next.x - previous.x;
    y += next.y - previous.y;
    if (previous.distance && next.distance)
      zoom((scale * next.distance) / previous.distance, next.x, next.y);
    else paint();
    previous = next;
  });
  const release = (event) => {
    pointers.delete(event.pointerId);
    previous = gesture();
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  new ResizeObserver(paint).observe(viewport);

  return {
    reset() {
      image = viewport.querySelector(':scope > img, :scope > .media-spread');
      scale = 1;
      x = y = 0;
      pointers.clear();
      controls.hidden = !image;
      viewport.classList.toggle('can-zoom', Boolean(image));
      viewport.classList.remove('is-zoomed');
      if (image) {
        image.draggable = false;
        image.addEventListener('load', paint, { once: true });
        paint();
      }
    },
  };
}
