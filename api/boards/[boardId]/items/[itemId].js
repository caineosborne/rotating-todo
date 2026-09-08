import { removeItem, updateItem } from '../../../../lib/model.js';
import { mutateData } from '../../../../lib/store.js';
import { badRequest, handleError, methodNotAllowed, requestError, requireName } from '../../../_helpers.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'PATCH' && req.method !== 'DELETE') return methodNotAllowed(res, ['PATCH', 'DELETE']);

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
    if (req.body?.lastActioned !== undefined) {
      if (req.body.lastActioned === null) {
        updates.lastActioned = null;
      } else if (typeof req.body.lastActioned !== 'string' || Number.isNaN(Date.parse(req.body.lastActioned))) {
        return badRequest(res, 'Last actioned must be a valid date or null');
      } else {
        updates.lastActioned = new Date(req.body.lastActioned).toISOString();
      }
    }
    const data = await mutateData((current) => {
      const board = current.boards.find((entry) => entry.id === req.query.boardId);
      const item = board?.items.find((entry) => entry.id === req.query.itemId);
      if (!board) throw requestError(404, 'Board not found');
      if (!item) throw requestError(404, 'Item not found');
      return req.method === 'DELETE'
        ? removeItem(current, board.id, item.id)
        : updateItem(current, board.id, item.id, updates);
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}
