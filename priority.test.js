import test from 'node:test';
import assert from 'node:assert/strict';
import { priorityAge, sortItems } from './lib/priority.js';
import { actionItem, createBoard, createItem, emptyData, removeItem, updateItem } from './lib/model.js';
import { calendarDaysSince, dateInputToISOString, toDateInputValue } from './lib/dates.js';

const now = Date.parse('2026-09-07T12:00:00.000Z');

test('never actioned items are always first', () => {
  const items = [
    { id: 'old', name: 'Old', favourite: false, lastActioned: '2026-08-01T12:00:00.000Z' },
    { id: 'new', name: 'Never', favourite: false, lastActioned: null },
  ];
  assert.deepEqual(sortItems(items, now).map((item) => item.id), ['new', 'old']);
});

test('favourites multiply priority age, rather than divide it', () => {
  const favourite = { id: 'favourite', name: 'Favourite', favourite: true, lastActioned: '2026-09-02T12:00:00.000Z' };
  const normal = { id: 'normal', name: 'Normal', favourite: false, lastActioned: '2026-08-28T12:00:00.000Z' };
  assert.equal(priorityAge(favourite, now), 10);
  assert.equal(priorityAge(normal, now), 10);
  assert.deepEqual(sortItems([normal, favourite], now).map((item) => item.id), ['favourite', 'normal']);
});

test('items are sorted by days since actioned, with a stable name tie-breaker', () => {
  const items = [
    { id: 'b', name: 'Beta', favourite: false, lastActioned: '2026-09-05T12:00:00.000Z' },
    { id: 'a', name: 'Alpha', favourite: false, lastActioned: '2026-09-05T12:00:00.000Z' },
  ];
  assert.deepEqual(sortItems(items, now).map((item) => item.id), ['a', 'b']);
});

test('model supports board/item creation, updates, actioning, and removal', () => {
  let data = createBoard(emptyData(), 'Recipes');
  const board = data.boards[0];
  data = createItem(data, board.id, 'Chicken curry');
  const item = data.boards[0].items[0];
  data = updateItem(data, board.id, item.id, { favourite: true });
  data = actionItem(data, board.id, item.id, new Date(now));
  assert.equal(data.boards[0].items[0].favourite, true);
  assert.equal(data.boards[0].items[0].lastActioned, '2026-09-07T12:00:00.000Z');
  data = removeItem(data, board.id, item.id);
  assert.equal(data.boards[0].items.length, 0);
});

test('calendar days change at local midnight rather than after 24 hours', () => {
  const now = new Date(2026, 8, 8, 0, 15);
  const yesterday = new Date(2026, 8, 7, 23, 45);
  assert.equal(calendarDaysSince(yesterday, now), 1);
});

test('manual action dates preserve the selected local calendar day', () => {
  const now = new Date(2026, 8, 8, 9, 30);
  const value = dateInputToISOString('2026-09-05', now);
  assert.equal(toDateInputValue(value), '2026-09-05');
  assert.equal(calendarDaysSince(value, now), 3);
  assert.equal(dateInputToISOString('', now), null);
});
