import { initServices } from './services/index.js';
import { initPortfolio } from './portfolio/index.js';
import { initNavigation } from './navigation/index.js';
import { initLamps } from './lamp/index.js';
import { query } from './core/dom.js';
import { initScrollReveal } from './scroll-reveal.js?v=20261022-room';
import { initRetroTV } from './footer/television.js';
import { initRoomRadio } from './footer/radio.js';

document.documentElement.classList.add('enhanced');
initServices();
initPortfolio();
initNavigation();
// Surfaces are rendered before the lamp collects its lighting targets.
initLamps();
initScrollReveal();
initRetroTV();
initRoomRadio();
query('#year').textContent = String(new Date().getFullYear());
