import assert from 'node:assert/strict';
import { containedMediaRect, pointInside } from '../js/portfolio/viewer-dismiss.js';
import { heroIsCurrent } from '../js/lamp/hero-power.js';
import { shouldRetractLamp } from '../js/lamp/retraction.js';

const viewport = { left: 10, top: 100, right: 410, bottom: 700, width: 400, height: 600 };
const landscape = containedMediaRect(viewport, 1600, 900);
assert.deepEqual(landscape, { left: 10, top: 287.5, right: 410, bottom: 512.5 });
assert.equal(pointInside(landscape, 200, 200), false, 'Empty letterbox dismisses the viewer');
assert.equal(pointInside(landscape, 200, 400), true, 'Actual photo remains interactive');
const portrait = containedMediaRect(viewport, 300, 900);
assert.equal(pointInside(portrait, 20, 400), false, 'Portrait side margins are empty too');
assert.equal(pointInside(portrait, 210, 400), true);
const zoomed = containedMediaRect({ left: -190, top: -200, width: 800, height: 1200 }, 1600, 900);
assert.deepEqual(zoomed, { left: -190, top: 175, right: 610, bottom: 625 }, 'Hit area follows zoom and pan');
assert.equal(containedMediaRect(viewport, 0, 0), viewport, 'Loading media stays protected');

assert.equal(heroIsCurrent({ top: 0, bottom: 800 }, 130), true);
assert.equal(heroIsCurrent({ top: -670, bottom: 130 }, 130), false, 'Lamp switches off at content boundary');
assert.equal(heroIsCurrent({ top: -600, bottom: 200 }, 130), true, 'Returning to hero restores power');
assert.equal(heroIsCurrent({ top: -3000, bottom: -2200 }, 130), false, 'Anchored portfolio loads with light off');
assert.equal(shouldRetractLamp(4200, 800, 5000), true, 'Lamp retracts at the document end');
assert.equal(shouldRetractLamp(4188, 800, 5000), true, 'Subpixel/rounding margin still reaches the end');
assert.equal(shouldRetractLamp(4100, 800, 5000), false, 'Scrolling above the end keeps the lamp visible');
assert.equal(shouldRetractLamp(4160, 800, 5000, true), true, 'Small bottom jitter does not flicker the rig');
assert.equal(shouldRetractLamp(4135, 800, 5000, true), false, 'Scrolling up restores the rig');
assert.equal(shouldRetractLamp(0, 800, 700), false, 'A non-scrollable page never hides the lamp');
assert.equal(shouldRetractLamp(4300, 800, 5000), true, 'Elastic overscroll stays retracted');
console.log('Validated viewer hit areas, hero lamp boundaries and bottom retraction hysteresis.');
