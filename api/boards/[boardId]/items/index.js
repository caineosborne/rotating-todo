import { createItem, updateItem } from '../../../../lib/model.js';
import { readData, writeData } from '../../../../lib/store.js';
import { badRequest, handleError, methodNotAllowed, notFound, requireName } from '../../../_helpers.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
    const data = await readData();
    if (!data.boards.some((board) => board.id === req.query.boardId)) return notFound(res, 'Board not found');
    const name = requireName(res, req.body?.name, 'Item name');
    if (!name) return;
    if (req.body?.favourite !== undefined && typeof req.body.favourite !== 'boolean') return badRequest(res, 'Favourite must be a boolean');
    let next = createItem(data, req.query.boardId, name);
    if (req.body?.favourite) {
      const createdItem = next.boards.find((board) => board.id === req.query.boardId).items.at(-1);
      next = updateItem(next, req.query.boardId, createdItem.id, { favourite: true });
    }
    return res.status(201).json(await writeData(next));
  } catch (error) {
    return handleError(res, error);
  }
}
