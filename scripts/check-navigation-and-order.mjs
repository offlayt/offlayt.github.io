import assert from 'node:assert/strict';
import { materialCount, orderAllProjects } from '../js/portfolio/order.js';
import { activeSectionId } from '../js/navigation/active-section.js';

const fixtures = [
  { id: 'photos', slides: [{ src: 'a' }, { src: 'b' }] },
  { id: 'small-video', slides: [{ src: 'movie.mp4', video: true }] },
  { id: 'spread', slides: [{ src: 'cover' }, { images: ['left', 'right'], src: 'left' }] },
  { id: 'large-video', slides: [{ src: 'clip.mp4', video: true }, { src: 'still' }] },
  { id: 'same-size', slides: [{ src: 'c' }, { src: 'd' }] },
];
assert.deepEqual(orderAllProjects(fixtures).map(p => p.id), [
  'large-video', 'small-video', 'spread', 'photos', 'same-size',
], 'Video is the primary priority, then source count descending; ties remain stable');
assert.equal(materialCount(fixtures[2]), 3, 'Spread pages count individually');
assert.equal(materialCount({ slides: [{ src: 'one' }, { src: 'one' }] }), 1, 'Repeated sources count once');
assert.equal(fixtures[0].id, 'photos', 'Sorting leaves the editorial source array untouched');

const sections = [{ id: 'services', top: 600 }, { id: 'portfolio', top: 2000 }];
assert.equal(activeSectionId(sections, 136), null, 'Hero has no selected header item');
assert.equal(activeSectionId(sections, 600), 'services', 'First section becomes active at its boundary');
assert.equal(activeSectionId(sections, 2500), 'portfolio', 'Later section replaces the earlier selection');
assert.equal(activeSectionId(sections, 136), null, 'Returning to the hero clears the selection');
console.log('Validated portfolio ordering and header selection boundaries.');
