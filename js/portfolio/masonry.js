/** Pure masonry geometry. Existing cards keep their column as slides change. */
export function placeMasonryCards(items, { columns, width, columnGap, rowGap }, previous = new Map()) {
  const bottoms = Array(columns).fill(0);
  const assignments = new Map();
  const positions = items.map(({ id, height }) => {
    const saved = previous.get(id);
    const column = saved !== undefined && saved < columns
      ? saved
      : bottoms.indexOf(Math.min(...bottoms));
    const position = { id, column, x: column * (width + columnGap), y: bottoms[column] };
    bottoms[column] += height + rowGap;
    assignments.set(id, column);
    return position;
  });
  return {
    positions,
    assignments,
    height: items.length ? Math.max(...bottoms) - rowGap : 0,
  };
}
