import { removeItem, updateItem } from '../../../../lib/model.js';
import { readData, writeData } from '../../../../lib/store.js';
import { badRequest, handleError, methodNotAllowed, notFound, requireName } from '../../../_helpers.js';

export default async function handler(req, res) {
  try {
    const data = await readData();
    const board = data.boards.find((entry) => entry.id === req.query.boardId);
    const item = board?.items.find((entry) => entry.id === req.query.itemId);
    if (!board) return notFound(res, 'Board not found');
    if (!item) return notFound(res, 'Item not found');
    if (req.method === 'DELETE') return res.status(200).json(await writeData(removeItem(data, board.id, item.id)));
    if (req.method !== 'PATCH') return methodNotAllowed(res, ['PATCH', 'DELETE']);

    const updates = {};
    if (req.body?.name !== undefined) {
      const name = requireName(res, req.body.name, 'Item name');
      if (!name) return;
      updates.name = name;
    }
    if (req.body?.favourite !== undefined) {
      if (typeof req.body.favourite !== 'boolean') return badRequest(res, 'Favourite must be a boolean');
      updates.favourite = req.body.favourite;
    }
    return res.status(200).json(await writeData(updateItem(data, board.id, item.id, updates)));
  } catch (error) {
    return handleError(res, error);
  }
}
