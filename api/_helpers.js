export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  return res.status(405).json({ error: 'Method not allowed' });
}

export function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

export function notFound(res, message = 'Not found') {
  return res.status(404).json({ error: message });
}

export function handleError(res, error) {
  console.error(error);
  if (Number.isInteger(error?.status) && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error?.name === 'BlobPreconditionFailedError') {
    return res.status(409).json({ error: 'The list changed elsewhere. Please try your change again.' });
  }
  return res.status(500).json({ error: 'Something went wrong while saving your changes.' });
}

export function requestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function requireName(res, value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    badRequest(res, `${label} is required`);
    return null;
  }
  return value.trim().slice(0, 120);
}
