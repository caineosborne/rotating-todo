import { sortItems } from './lib/priority.js';

const state = {
  data: { boards: [] },
  selectedBoardId: null,
  pending: new Set(),
  syncStatus: 'loading',
};

const $ = (selector) => document.querySelector(selector);
const boardList = $('#board-list');
const itemList = $('#item-list');
let writeQueue = Promise.resolve();
let lastFailedSave = null;
let syncedTimer;

async function request(path, options = {}) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || 'Could not save that change.');
    error.status = response.status;
    throw error;
  }
  return body;
}

async function load() {
  try {
    state.data = await request('/api/boards');
    ensureSelectedBoard();
    setSyncStatus('synced');
  } catch (error) {
    setSyncStatus('error');
    showSaveError('Could not load your boards. Check the connection and try again.');
    $('#empty-state').textContent = 'Could not load your boards. Check the connection and try again.';
  } finally {
    $('#loading-screen').classList.add('is-hidden');
    render();
  }
}

function currentBoard() {
  return state.data.boards.find((board) => board.id === state.selectedBoardId) || null;
}

function ensureSelectedBoard() {
  if (!state.selectedBoardId || !state.data.boards.some((board) => board.id === state.selectedBoardId)) {
    state.selectedBoardId = state.data.boards[0]?.id || null;
  }
}

function queueWrite(operation) {
  const result = writeQueue.then(operation);
  writeQueue = result.catch(() => {});
  return result;
}

async function saveChange({ key, operation, successMessage, afterSuccess }) {
  if (state.pending.has(key)) return;
  const descriptor = { key, operation, successMessage, afterSuccess };
  state.pending.add(key);
  lastFailedSave = null;
  hideSaveError();
  setSyncStatus('saving');
  render();

  try {
    state.data = await queueWrite(operation);
    afterSuccess?.(state.data);
    ensureSelectedBoard();
    state.pending.delete(key);
    setSyncStatus(state.pending.size ? 'saving' : 'saved');
    render();
    notify(successMessage || 'Saved');
    scheduleSyncedStatus();
  } catch (error) {
    state.pending.delete(key);
    lastFailedSave = descriptor;
    setSyncStatus('error');
    showSaveError(error.status === 409
      ? 'This list changed somewhere else. Try again to apply your change to the latest version.'
      : error.message);
    render();
  }
}

function scheduleSyncedStatus() {
  clearTimeout(syncedTimer);
  syncedTimer = setTimeout(() => {
    if (!state.pending.size && state.syncStatus !== 'error') setSyncStatus('synced');
  }, 1400);
}

function setSyncStatus(status) {
  state.syncStatus = status;
  const labels = { loading: 'Loading…', saving: 'Saving…', saved: 'Saved', synced: 'Synced to the cloud', error: 'Not saved' };
  $('#sync-label').textContent = labels[status];
  $('#sync-status').dataset.status = status;
}

function showSaveError(message) {
  $('#save-error-message').textContent = message;
  $('#save-error').hidden = false;
  $('#retry-save').hidden = !lastFailedSave;
}

function hideSaveError() {
  $('#save-error').hidden = true;
}

function render() {
  const board = currentBoard();
  $('#board-count').textContent = state.data.boards.length;
  boardList.innerHTML = state.data.boards.map((entry) => `
    <button class="board-link ${entry.id === state.selectedBoardId ? 'selected' : ''}" data-board-id="${entry.id}" type="button">
      <span>${escapeHtml(entry.name)}</span><span class="board-total">${entry.items.length}</span>
    </button>`).join('');

  $('#board-title').textContent = board?.name || 'Your rotation';
  $('#board-actions').hidden = !board;
  $('#item-form').hidden = !board;
  $('#intro').classList.toggle('muted-intro', !board);

  const boardPending = board && state.pending.has(`board:${board.id}`);
  $('#rename-board').disabled = Boolean(boardPending);
  $('#delete-board').disabled = Boolean(boardPending);

  const boardFormPending = state.pending.has('board:new');
  $('#board-name').disabled = boardFormPending;
  $('#add-board').disabled = boardFormPending;
  $('#add-board').textContent = boardFormPending ? '…' : '+';

  const itemFormKey = board ? `item:new:${board.id}` : '';
  const itemFormPending = state.pending.has(itemFormKey);
  $('#item-name').disabled = itemFormPending;
  $('#add-item').disabled = itemFormPending;
  $('#add-item').innerHTML = itemFormPending ? 'Saving…' : 'Add item <span>↵</span>';

  const items = board ? sortItems(board.items) : [];
  $('#item-count').textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;
  $('#empty-state').hidden = !board || items.length > 0;
  $('#empty-state').textContent = board
    ? 'Nothing in this rotation yet. Add the first thing you want to return to.'
    : 'Create a board to start your first rotation.';
  itemList.innerHTML = items.map(itemTemplate).join('');
}

function itemTemplate(item) {
  const pending = state.pending.has(`item:${item.id}`);
  const actionLabel = pending ? 'Saving…' : item.lastActioned ? 'Action again' : 'Action';
  const disabled = pending ? ' disabled aria-busy="true"' : '';
  return `<article class="item-row ${item.favourite ? 'is-favourite' : ''} ${pending ? 'is-saving' : ''}">
    <button class="favourite-button" data-action="favourite" data-item-id="${item.id}" type="button" aria-label="${item.favourite ? 'Remove from favourites' : 'Add to favourites'}" aria-pressed="${item.favourite}"${disabled}>${item.favourite ? '★' : '☆'}</button>
    <div class="item-copy"><h3>${escapeHtml(item.name)}</h3><p title="${item.lastActioned ? new Date(item.lastActioned).toLocaleString() : 'Never actioned'}">Last actioned <strong>${humanDate(item.lastActioned)}</strong></p></div>
    <div class="row-actions"><button class="action-button" data-action="action" data-item-id="${item.id}" type="button"${disabled}>${actionLabel} <span>${pending ? '·' : '↻'}</span></button><button class="more-button" data-action="edit" data-item-id="${item.id}" type="button" aria-label="Edit ${escapeHtml(item.name)}"${disabled}>Edit</button><button class="more-button" data-action="delete" data-item-id="${item.id}" type="button" aria-label="Delete ${escapeHtml(item.name)}"${disabled}>Delete</button></div>
  </article>`;
}

function humanDate(value) {
  if (!value) return 'Never';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]);
}

function notify(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

$('#board-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#board-name');
  const name = input.value.trim();
  if (!name) return;
  saveChange({
    key: 'board:new',
    operation: () => request('/api/boards', { method: 'POST', body: JSON.stringify({ name }) }),
    successMessage: 'Board created',
    afterSuccess: (data) => { state.selectedBoardId = data.boards.at(-1)?.id || null; input.value = ''; },
  });
});

$('#item-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const boardId = state.selectedBoardId;
  const input = $('#item-name');
  const name = input.value.trim();
  if (!boardId || !name) return;
  saveChange({
    key: `item:new:${boardId}`,
    operation: () => request(`/api/boards/${boardId}/items`, { method: 'POST', body: JSON.stringify({ name }) }),
    successMessage: 'Item added',
    afterSuccess: () => { input.value = ''; },
  });
});

boardList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-board-id]');
  if (button) { state.selectedBoardId = button.dataset.boardId; render(); }
});

itemList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const itemId = button.dataset.itemId;
  const item = currentBoard().items.find((entry) => entry.id === itemId);
  const base = `/api/boards/${state.selectedBoardId}/items/${itemId}`;

  if (button.dataset.action === 'action') {
    saveChange({ key: `item:${itemId}`, operation: () => request(`${base}/action`, { method: 'POST' }), successMessage: 'Action saved' });
  }
  if (button.dataset.action === 'favourite') {
    saveChange({ key: `item:${itemId}`, operation: () => request(base, { method: 'PATCH', body: JSON.stringify({ favourite: !item.favourite }) }), successMessage: item.favourite ? 'Favourite removed' : 'Favourite saved' });
  }
  if (button.dataset.action === 'edit') {
    const name = prompt('Rename item', item.name);
    if (name === null) return;
    if (!name.trim()) return notify('Item name cannot be empty');
    saveChange({ key: `item:${itemId}`, operation: () => request(base, { method: 'PATCH', body: JSON.stringify({ name }) }), successMessage: 'Item renamed' });
  }
  if (button.dataset.action === 'delete') {
    if (!confirm(`Delete “${item.name}”?`)) return;
    saveChange({ key: `item:${itemId}`, operation: () => request(base, { method: 'DELETE' }), successMessage: 'Item deleted' });
  }
});

$('#rename-board').addEventListener('click', () => {
  const board = currentBoard();
  const name = prompt('Rename board', board.name);
  if (name === null) return;
  if (!name.trim()) return notify('Board name cannot be empty');
  saveChange({ key: `board:${board.id}`, operation: () => request(`/api/boards/${board.id}`, { method: 'PATCH', body: JSON.stringify({ name }) }), successMessage: 'Board renamed' });
});

$('#delete-board').addEventListener('click', () => {
  const board = currentBoard();
  if (!confirm(`Delete “${board.name}” and all its items?`)) return;
  saveChange({ key: `board:${board.id}`, operation: () => request(`/api/boards/${board.id}`, { method: 'DELETE' }), successMessage: 'Board deleted' });
});

$('#retry-save').addEventListener('click', () => {
  if (!lastFailedSave) return;
  const failedSave = lastFailedSave;
  lastFailedSave = null;
  saveChange(failedSave);
});

load();
