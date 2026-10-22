import { query, queryAll } from '../core/dom.js';

/** Converts the fixed lamp's coordinates into each moving surface's coordinates. */
export class SurfaceLighting {
  constructor(scene, requestRender) {
    this.scene = scene;
    this.wallpaper = query('.wallpaper');
    this.surfaces = queryAll('.light-surface');
    const grid = query('#project-grid');
    if (grid) {
      this.observer = new MutationObserver(() => {
        this.surfaces = queryAll('.light-surface');
        requestRender();
      });
      this.observer.observe(grid, { childList: true });
    }
    const onSurfaceChange = (event) => {
      if (event.target.closest?.('.light-surface, .web-deck')) requestRender();
    };
    document.addEventListener('toggle', onSurfaceChange, true);
    document.addEventListener('transitionend', onSurfaceChange);
  }

  render(x, y, lit) {
    const scene = this.scene.getBoundingClientRect();
    const surfaces = this.surfaces.map((element) => ({
      element,
      rect: element.getBoundingClientRect(),
    }));
    // Keep all geometry reads above all writes to avoid repeated layout flushes.
    if (this.wallpaper) {
      // The wall is fixed to the viewport; the lamp scene starts below the header.
      this.wallpaper.style.setProperty('--wall-light-x', `${scene.left + x}px`);
      this.wallpaper.style.setProperty('--wall-light-y', `${scene.top + y}px`);
      this.wallpaper.style.setProperty('--wall-light-power', lit ? '1' : '0');
    }
    surfaces.forEach(({ element, rect }) => {
      const visible = rect.bottom >= 0 && rect.top <= innerHeight;
      const power = lit && visible ? '1' : '0';
      if (element.style.getPropertyValue('--light-power') !== power)
        element.style.setProperty('--light-power', power);
      if (!visible) return;
      element.style.setProperty('--light-x', `${scene.left + x - rect.left}px`);
      element.style.setProperty('--light-y', `${scene.top + y - rect.top}px`);
    });
  }
}
