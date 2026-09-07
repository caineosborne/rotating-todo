import { actionItem } from '../../../../../lib/model.js';
import { mutateData } from '../../../../../lib/store.js';
import { handleError, methodNotAllowed, requestError } from '../../../../_helpers.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
    const data = await mutateData((current) => {
      const board = current.boards.find((entry) => entry.id === req.query.boardId);
      const item = board?.items.find((entry) => entry.id === req.query.itemId);
      if (!board) throw requestError(404, 'Board not found');
      if (!item) throw requestError(404, 'Item not found');
      return actionItem(current, board.id, item.id);
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}
