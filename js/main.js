import { initServices } from './services/index.js';
import { initPortfolio } from './portfolio/index.js?v=20261026-camera-loader';
import { initNavigation } from './navigation/index.js';
import { initLamps } from './lamp/index.js?v=20261023-earlier-retract';
import { initScrollReveal } from './scroll-reveal.js?v=20261022-room';
import { initRetroTV } from './footer/television.js';
import { initRoomRadio } from './footer/radio.js?v=20261023-spectrum-bars';

document.documentElement.classList.add('enhanced');
initServices();
initPortfolio();
initNavigation();
// Surfaces are rendered before the lamp collects its lighting targets.
initLamps();
if (window.__pageLoader && !window.__pageLoader.finished) {
  window.addEventListener('portfolio:revealed', initScrollReveal, { once: true });
} else initScrollReveal();
initRetroTV();
initRoomRadio();
if (window.__pageLoader) window.__pageLoader.appReady = true;
window.dispatchEvent(new Event('portfolio:ready'));
