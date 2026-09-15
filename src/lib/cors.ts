import type { NextApiRequest, NextApiResponse } from 'next';

const ALLOWED_ORIGINS = [
  'https://osspatches.com',
  'https://www.osspatches.com',
  // Allow local dev
  'http://localhost:3000',
  'http://localhost:3001',
];

/**
 * Sets CORS headers and handles preflight OPTIONS requests.
 * Returns true if the request was a preflight (caller should return immediately).
 */
export function handleCors(req: NextApiRequest, res: NextApiResponse): boolean {
  const origin = req.headers.origin ?? '';

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
