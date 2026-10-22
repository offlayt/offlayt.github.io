import assert from 'node:assert/strict';
import { placeMasonryCards } from '../js/portfolio/masonry.js';

const options = { columns: 3, width: 100, columnGap: 10, rowGap: 10 };
const items = [300, 100, 200, 80, 70].map((height, index) => ({ id: String(index), height }));
const first = placeMasonryCards(items, options);
assert.deepEqual(first.positions.map(({ column, y }) => [column, y]), [
  [0, 0], [1, 0], [2, 0], [1, 110], [1, 200],
], 'New cards fill the shortest available column without horizontal rows');
assert.equal(first.height, 300, 'Container encloses the tallest column');

const changed = items.map(item => item.id === '1' ? { ...item, height: 400 } : item);
const next = placeMasonryCards(changed, options, first.assignments);
assert.deepEqual([...next.assignments], [...first.assignments], 'Autoplay never shuffles columns');
assert.equal(next.positions[3].y, 410, 'Following cards move below taller media');
assert.equal(next.height, 570, 'Container grows with its content');

for (const columns of [1, 2, 3]) {
  const config = { ...options, columns };
  const layout = placeMasonryCards(changed, config);
  for (let column = 0; column < columns; column++) {
    const stack = layout.positions.filter(position => position.column === column);
    assert.equal(stack[0]?.y ?? 0, 0, 'Columns align to the same top edge');
    for (let index = 1; index < stack.length; index++) {
      const previous = stack[index - 1];
      const height = changed.find(item => item.id === previous.id).height;
      assert.equal(stack[index].y, previous.y + height + options.rowGap, 'No overlap or empty row gaps');
    }
  }
}
assert.equal(placeMasonryCards([], options).height, 0, 'An empty search collapses the layout');
console.log('Validated masonry placement, stable columns, resizing and empty results.');
