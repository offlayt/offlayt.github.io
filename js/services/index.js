import { query } from '../core/dom.js';
import { websiteServices, designServices } from '../data/services.js';
import { initWebDeck } from './web-deck.js';
import { designCard } from './templates.js';

export function initServices() {
  initWebDeck(websiteServices);
  const designGrid = query('#design-grid');
  if (designGrid) designGrid.innerHTML = designServices.map(designCard).join('');
}
