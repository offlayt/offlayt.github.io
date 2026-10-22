/** A spread contains two source images, but is still only one gallery slide. */
export const materialCount = (project) => new Set(
  project.slides.flatMap((slide) => slide.images || [slide.src]),
).size;

/** Video first, then source count descending. Ties keep the editorial order. */
export function orderAllProjects(projects) {
  return projects
    .map((project, index) => ({
      project,
      index,
      video: project.slides.some((slide) => slide.video),
      count: materialCount(project),
    }))
    .sort((a, b) => Number(b.video) - Number(a.video) || b.count - a.count || a.index - b.index)
    .map(({ project }) => project);
}
