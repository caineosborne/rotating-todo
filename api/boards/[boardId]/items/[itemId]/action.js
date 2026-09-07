import { actionItem } from '../../../../../lib/model.js';
import { readData, writeData } from '../../../../../lib/store.js';
import { handleError, methodNotAllowed, notFound } from '../../../../_helpers.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
    const data = await readData();
    const board = data.boards.find((entry) => entry.id === req.query.boardId);
    const item = board?.items.find((entry) => entry.id === req.query.itemId);
    if (!board) return notFound(res, 'Board not found');
    if (!item) return notFound(res, 'Item not found');
    return res.status(200).json(await writeData(actionItem(data, board.id, item.id)));
  } catch (error) {
    return handleError(res, error);
  }
}
