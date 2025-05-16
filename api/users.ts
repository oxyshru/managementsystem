// api/users.ts
// This file handles the GET all users endpoint
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from './utils/db';
import { sendApiResponse } from './utils/apiResponse';
import { authMiddleware } from './utils/authMiddleware';
import { User } from '../src/types/database.types'; // Corrected import path
import { PoolClient } from 'pg';

// Wrap the handler with authMiddleware, requiring 'admin' role for GET
export default authMiddleware(async (req: VercelRequest & { user?: Omit<User, 'password'> }, res: VercelResponse) => {
    if (req.method !== 'GET') {
        sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        return;
    }

    // The authMiddleware already checked for admin role, so we can proceed
    let client: PoolClient | undefined;
    try {
        client = await getConnection();

        // Fetch all users (excluding password)
        const result = await client.query('SELECT id, username, email, role, status, created_at, updated_at FROM users');

        sendApiResponse(res, true, result.rows as User[], undefined, 200);

    } catch (error) {
        console.error('Get all users error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to fetch users', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin']); // This endpoint requires 'admin' role

