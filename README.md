# Rotating

A small, shared to-do list for things you return to. Items are never permanently completed: actioning one stamps the current time and sends it to the back of the rotation.

## Local development

Requirements: Node.js 18+ and a Vercel account.

```bash
npm install
npm test
npx vercel dev
```

The app runs at the local URL shown by `vercel dev`. The API needs a Vercel Blob store to read and write data. For local development, link the project with `vercel link` and run `vercel env pull .env.local`, or create `.env.local` with:

```text
BLOB_READ_WRITE_TOKEN=your_vercel_blob_read_write_token
```

The token is provided automatically to deployed Vercel Functions when a Blob store is connected to the project.

## Deployment

1. Import this repository into Vercel.
2. Create a Blob store in the Vercel project under Storage → Blob.
3. Connect the store to the project and make sure `BLOB_READ_WRITE_TOKEN` is available in the deployment environment.
4. Deploy. The static `index.html` frontend and the `/api` serverless functions are deployed together.

The app stores one private JSON object at `rotating-todo/data.json` in Vercel Blob. It does not write to the serverless function filesystem and does not use `localStorage` as its source of truth. The private-store implementation requires `@vercel/blob` 2.3 or newer.

## Priority

`lib/priority.js` is the standalone sorting implementation. Never-actioned items sort first. Otherwise, priority age is days since actioned, doubled for favourites. Run the tests with `npm test`.

This intentionally has no authentication. Treat the Blob URL/token as a private project configuration until access control is added.

## Saving and conflicts

The interface shows a blocking loading screen on startup and an explicit `Saving…` state for each change. Writes are queued in the browser so rapid changes are sent in order. Blob writes use the version read with the data; if another browser saves first, the API reloads the newest data and retries the requested mutation before reporting a conflict. Newer data is never silently overwritten.
