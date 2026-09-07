import { createItem, updateItem } from '../../../../lib/model.js';
import { mutateData } from '../../../../lib/store.js';
import { badRequest, handleError, methodNotAllowed, requestError, requireName } from '../../../_helpers.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
    const name = requireName(res, req.body?.name, 'Item name');
    if (!name) return;
    if (req.body?.favourite !== undefined && typeof req.body.favourite !== 'boolean') return badRequest(res, 'Favourite must be a boolean');
    const data = await mutateData((current) => {
      if (!current.boards.some((board) => board.id === req.query.boardId)) throw requestError(404, 'Board not found');
      let next = createItem(current, req.query.boardId, name);
      if (req.body?.favourite) {
        const createdItem = next.boards.find((board) => board.id === req.query.boardId).items.at(-1);
        next = updateItem(next, req.query.boardId, createdItem.id, { favourite: true });
      }
      return next;
    });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}
