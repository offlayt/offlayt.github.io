import { projectCatalog } from './project-catalog.js';

export const workTypes = {
  all: 'Все работы',
  site: 'Сайт',
  brand: 'Фирменный стиль',
  brandbooks: 'Брендбук',
  logos: 'Логотипы',
  cards: 'Визитки',
  print: 'Полиграфия',
  posters: 'Плакатная графика',
  packaging: 'Упаковка',
  mascots: 'Персонажи и маскоты',
  merch: 'Мерч',
  stickers: 'Стикерпаки',
  magazines: 'Издательский дизайн',
  presentations: 'Презентации',
  ads: 'Рекламная графика',
  marketplace: 'Маркетплейсы',
  motion: 'Моушн-дизайн',
  panel: 'Интерфейсы',
};

export const typeColors = {
  all: '#dfb669', site: '#a8cce8', brand: '#c4b0ec', brandbooks: '#d8b4cf',
  logos: '#b6b9eb', cards: '#e7c2a0', print: '#d7cba5', posters: '#ecac99',
  packaging: '#c7cf8e', mascots: '#b6d49b', merch: '#9bcbb9', stickers: '#ded88e',
  magazines: '#d2b5b0', presentations: '#adbedf', ads: '#e5b77f',
  marketplace: '#b0d1c7', motion: '#c2aff0', panel: '#96c8cd',
};

export const projects = projectCatalog;
export const projectsById = new Map(projects.map((project) => [project.id, project]));

/** Case access follows the visible badges, never a broad legacy category. */
export const hasDetailedCase = (project) => Boolean(project.caseHref)
  && project.types.some((type) => ['site', 'brand', 'brandbooks'].includes(type));
