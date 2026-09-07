import { readData, writeData } from '../../../lib/store.js';
import { removeBoard, updateBoard } from '../../../lib/model.js';
import { handleError, methodNotAllowed, notFound, requireName } from '../../_helpers.js';

export default async function handler(req, res) {
  try {
    const data = await readData();
    const board = data.boards.find((entry) => entry.id === req.query.boardId);
    if (!board) return notFound(res, 'Board not found');
    if (req.method === 'PATCH') {
      const name = requireName(res, req.body?.name, 'Board name');
      if (!name) return;
      return res.status(200).json(await writeData(updateBoard(data, board.id, name)));
    }
    if (req.method === 'DELETE') {
      return res.status(200).json(await writeData(removeBoard(data, board.id)));
    }
    return methodNotAllowed(res, ['PATCH', 'DELETE']);
  } catch (error) {
    return handleError(res, error);
  }
}
