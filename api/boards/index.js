import { createBoard } from '../../lib/model.js';
import { mutateData, readData } from '../../lib/store.js';
import { handleError, methodNotAllowed, requireName } from '../_helpers.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return res.status(200).json(await readData());
    if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);

    const name = requireName(res, req.body?.name, 'Board name');
    if (!name) return;
    const data = await mutateData((current) => createBoard(current, name));
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}
