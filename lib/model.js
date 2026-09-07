import { randomUUID } from 'node:crypto';
import { sortItems } from './priority.js';

export function emptyData() {
  return { boards: [] };
}

export function createBoard(data, name) {
  const board = { id: randomUUID(), name: name.trim(), items: [] };
  return { ...data, boards: [...data.boards, board] };
}

export function updateBoard(data, boardId, name) {
  return {
    ...data,
    boards: data.boards.map((board) => board.id === boardId ? { ...board, name: name.trim() } : board),
  };
}

export function removeBoard(data, boardId) {
  return { ...data, boards: data.boards.filter((board) => board.id !== boardId) };
}

export function createItem(data, boardId, name) {
  const item = { id: randomUUID(), name: name.trim(), favourite: false, lastActioned: null };
  return updateItems(data, boardId, (items) => [...items, item]);
}

export function updateItem(data, boardId, itemId, updates) {
  return updateItems(data, boardId, (items) => items.map((item) => item.id === itemId ? { ...item, ...updates } : item));
}

export function removeItem(data, boardId, itemId) {
  return updateItems(data, boardId, (items) => items.filter((item) => item.id !== itemId));
}

export function actionItem(data, boardId, itemId, now = new Date()) {
  return updateItem(data, boardId, itemId, { lastActioned: new Date(now).toISOString() });
}

export function sortBoardItems(board, now = Date.now()) {
  return { ...board, items: sortItems(board.items, now) };
}

function updateItems(data, boardId, callback) {
  return {
    ...data,
    boards: data.boards.map((board) => board.id === boardId ? { ...board, items: callback(board.items) } : board),
  };
}
