import { workTypes } from '../data/projects.js';
import { orderAllProjects } from './order.js';

export const normalizeQuery = (value) => value.trim().toLocaleLowerCase('ru');

/** Search text and slide indexes are prepared once, not on every keystroke. */
export function createPortfolioModel(projects) {
  const ordered = orderAllProjects(projects);
  const entries = new Map(
    projects.map((project) => {
      const indices = new Map([['all', project.slides.map((_, index) => index)]]);
      project.slides.forEach((slide, index) => {
        (slide.types || [slide.type]).forEach((type) => {
          if (!indices.has(type)) indices.set(type, []);
          indices.get(type).push(index);
        });
      });
      const search = normalizeQuery(
        `${project.name} ${project.search} ${project.description} ${project.status}
        ${project.types.map((type) => workTypes[type]).join(' ')} ${project.slides
          .map((slide) => `${slide.title}`)
          .join(' ')}`,
      );
      return [project.id, { project, indices, search }];
    }),
  );
  let filter = 'all';
  let query = '';

  return {
    get filter() {
      return filter;
    },
    setFilter(value) {
      filter = Object.hasOwn(workTypes, value) ? value : 'all';
    },
    setQuery(value) {
      query = normalizeQuery(value);
    },
    getProject(id) {
      return entries.get(id)?.project;
    },
    slideIndices(project) {
      return entries.get(project.id)?.indices.get(filter) || [];
    },
    visibleProjects() {
      return (filter === 'all' ? ordered : projects).filter((project) => {
        const entry = entries.get(project.id);
        return entry.indices.has(filter) && entry.search.includes(query);
      });
    },
  };
}
