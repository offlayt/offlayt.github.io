import { queryAll } from '../core/dom.js';
import { reducedMotion } from '../core/media.js';
import { HangingLamp } from './controller.js';
import { initHeroPower } from './hero-power.js';

export function initLamps() {
  const lamps = queryAll('.lamp-scene').map((scene) => new HangingLamp(scene));
  initHeroPower(lamps);
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    lamps.forEach((lamp) => {
      lamp.pause();
      lamp.angularVelocity = 0;
      lamp.tilt = lamp.angle;
      lamp.tiltVelocity = 0;
      lamp.render();
    });
  });
}
