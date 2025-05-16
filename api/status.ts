// api/status.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from './utils/db'; // Corrected import path
import { sendApiResponse } from './utils/apiResponse'; // Corrected import path

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(200).end();
      return;
  }

  if (req.method !== 'GET') {
    sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
    return;
  }

  let connection;
  try {
    // Attempt to get a connection to test the database
    connection = await getConnection();
    connection.release(); // Release immediately if successful

    sendApiResponse(res, true, { connected: true }, undefined, 200);
  } catch (error) {
    console.error('Database connection test failed:', error);
    sendApiResponse(res, false, { connected: false }, 'Database connection failed', 500);
  }
}
