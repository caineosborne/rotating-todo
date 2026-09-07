import { mutateData } from '../../../lib/store.js';
import { removeBoard, updateBoard } from '../../../lib/model.js';
import { handleError, methodNotAllowed, requestError, requireName } from '../../_helpers.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'PATCH') {
      const name = requireName(res, req.body?.name, 'Board name');
      if (!name) return;
      const data = await mutateData((current) => {
        if (!current.boards.some((board) => board.id === req.query.boardId)) throw requestError(404, 'Board not found');
        return updateBoard(current, req.query.boardId, name);
      });
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const data = await mutateData((current) => {
        if (!current.boards.some((board) => board.id === req.query.boardId)) throw requestError(404, 'Board not found');
        return removeBoard(current, req.query.boardId);
      });
      return res.status(200).json(data);
    }
    return methodNotAllowed(res, ['PATCH', 'DELETE']);
  } catch (error) {
    return handleError(res, error);
  }
}
