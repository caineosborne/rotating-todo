import { BlobNotFoundError, BlobPreconditionFailedError, get, put } from '@vercel/blob';
import { emptyData } from './model.js';

const blobPath = 'rotating-todo/data.json';
const blobOptions = { token: process.env.BLOB_READ_WRITE_TOKEN };
const blobVersion = Symbol('blobVersion');

export async function readData() {
  try {
    const { stream, blob } = await get(blobPath, { access: 'private', useCache: false, ...blobOptions });
    const parsed = await new Response(stream).json();
    const data = parsed?.boards ? parsed : emptyData();
    data[blobVersion] = blob.etag;
    return data;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return emptyData();
    throw error;
  }
}

export async function writeData(data) {
  const ifMatch = data[blobVersion];
  await put(blobPath, JSON.stringify(data, null, 2), {
    access: 'private',
    addRandomSuffix: false,
    ...(ifMatch ? { ifMatch } : { allowOverwrite: true }),
    contentType: 'application/json',
    ...blobOptions,
  });
  return data;
}

export async function mutateData(change, attempts = 3) {
  let conflict;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const data = await readData();
    const nextData = change(data);
    try {
      return await writeData(nextData);
    } catch (error) {
      if (!(error instanceof BlobPreconditionFailedError)) throw error;
      conflict = error;
    }
  }
  throw conflict;
}
