import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { projects, workTypes, hasDetailedCase } from '../js/data/projects.js';
import { createPortfolioModel } from '../js/portfolio/model.js';
import { mediaMarkup } from '../js/portfolio/media.js';

const root = new URL('../', import.meta.url);
const model = createPortfolioModel(projects);
assert.equal(new Set(projects.map(p => p.id)).size, projects.length, 'Unique project IDs');
assert.equal(projects.length, 34, 'The removed student campaign stays out of the catalog');
for (const project of projects) {
  assert.ok(project.slides.length, `${project.id}: gallery is nonempty`);
  const allowed = project.types.some(type => ['site', 'brand', 'brandbooks'].includes(type));
  assert.equal(hasDetailedCase(project), allowed, `${project.id}: case follows visible badges`);
  if (allowed) assert.ok(existsSync(fileURLToPath(new URL(project.caseHref, root))), project.caseHref);
  for (const type of project.types) {
    assert.ok(project.slides.some(slide => slide.types.includes(type)), `${project.id}: badge ${type} has media`);
  }
  for (const slide of project.slides) {
    assert.ok(slide.ratio > 0, `${project.id}: media has an aspect ratio`);
    assert.ok(slide.types.every(type => Object.hasOwn(workTypes, type)), `${project.id}: known media types`);
    const paths = [...(slide.images || [slide.src]), ...(slide.poster ? [slide.poster] : [])];
    for (const path of paths) assert.ok(existsSync(fileURLToPath(new URL(path, root))), path);
    if (slide.video) for (const controls of [false, true]) {
      const markup = mediaMarkup(slide, { controls });
      assert.match(markup, /muted/, 'Card and viewer videos start muted');
      assert.match(markup, /playsinline/, 'Video stays inline on phones');
    }
  }
}
for (const type of Object.keys(workTypes)) {
  model.setFilter(type);
  assert.ok(model.visibleProjects().length > 0, `Filter ${type} is nonempty`);
  for (const project of model.visibleProjects()) {
    assert.ok(model.slideIndices(project).length, `${type}: matching project has matching slides`);
  }
}
model.setFilter('brandbooks');
assert.deepEqual(model.visibleProjects().map(p => p.id).sort(), ['sladkaya-parochka', 'zebra']);
assert.equal(projects.find(p => p.id === 'sladkaya-parochka').slides.length, 32, 'All brandbook pages are present');
assert.ok(projects.find(p => p.id === 'rostok').slides.some(slide => slide.src === 'assets/demos/rostok/mobile.jpg'), 'Rostok has its supplied mobile screen');
model.setFilter('all');
model.setQuery('  ПЕРЕОБУВАШКИН  ');
assert.deepEqual(model.visibleProjects().map(p => p.id), ['perek'], 'Search ignores case and outer spaces');
model.setFilter('site');
assert.equal(model.visibleProjects().length, 0, 'Search and filters combine');
model.setQuery('несуществующаяработа');
assert.equal(model.visibleProjects().length, 0, 'Empty result is supported');
console.log(`Validated ${projects.length} projects, ${Object.keys(workTypes).length - 1} categories, media paths, case access and search.`);
