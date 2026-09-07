import { BlobNotFoundError, get, put } from '@vercel/blob';
import { emptyData } from './model.js';

const blobPath = 'rotating-todo/data.json';
const blobOptions = { token: process.env.BLOB_READ_WRITE_TOKEN };

export async function readData() {
  try {
    const { stream } = await get(blobPath, { access: 'private', useCache: false, ...blobOptions });
    const parsed = await new Response(stream).json();
    return parsed?.boards ? parsed : emptyData();
  } catch (error) {
    if (error instanceof BlobNotFoundError) return emptyData();
    throw error;
  }
}

export async function writeData(data) {
  await put(blobPath, JSON.stringify(data, null, 2), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    ...blobOptions,
  });
  return data;
}

export async function mutateData(change) {
  const data = await readData();
  return writeData(change(data));
}
