import { projectsById } from '../data/projects.js?v=20261023-new-works';
import { escapeHtml } from '../core/dom.js';

export function relatedLinks(ids, filter = 'all') {
  const links = ids.map((id) => {
    const project = projectsById.get(id);
    if (!project) throw new Error(`Unknown related project: ${id}`);
    return `<a href="#portfolio" data-related="${escapeHtml(id)}"
      data-related-filter="${escapeHtml(filter)}">${escapeHtml(project.name)}</a>`;
  });
  return `<div class="related-links">${links.join('')}</div>`;
}

export function webCard(service, index) {
  return `<article class="web-card light-surface" style="background:${escapeHtml(service.color)}" data-web="${index}">
    <button class="web-card-toggle" type="button" aria-label="Выбрать: ${escapeHtml(service.title)}" aria-pressed="false">
      <h4>${escapeHtml(service.title)}</h4>
      <span class="service-price">от ${escapeHtml(service.price)} ₽</span>
      <p>${escapeHtml(service.text)}</p>
      <span class="web-card-preview" aria-hidden="true"><img class="web-card-image" src="${escapeHtml(service.image)}" alt="" loading="lazy"></span>
    </button>
    <button class="web-detail-toggle" type="button" aria-label="Подробнее: ${escapeHtml(service.title)}" aria-expanded="false" aria-controls="web-detail-${index}" hidden>...</button>
    <div class="web-detail" id="web-detail-${index}" inert hidden>
      <p>${escapeHtml(service.detail)}</p>${relatedLinks(service.works)}
    </div>
  </article>`;
}

export function designCard(service) {
  return `<details class="design-card light-surface" style="--card-bg:${escapeHtml(service.color)}">
    <summary>
      <div class="design-visual"><img src="${escapeHtml(service.image)}" alt="" loading="lazy" width="1254" height="1254"></div>
      <div class="design-caption">
        <h4>${escapeHtml(service.title)}</h4>
        <span class="service-price">от ${escapeHtml(service.price)} ₽</span>
        <p>${escapeHtml(service.text)}</p>
      </div>
    </summary>
    <div class="design-detail"><p>${escapeHtml(service.detail)}</p>${relatedLinks(service.works, service.filter)}</div>
  </details>`;
}
