// api/users.ts
// This file handles the GET all users endpoint
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from './utils/db';
import { sendApiResponse } from './utils/apiResponse';
import { authMiddleware } from './utils/authMiddleware';
import { User } from '../src/types/database.types';
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

        // Transform snake_case from DB to camelCase for frontend
        const transformedUsers: User[] = result.rows.map(row => ({
            id: row.id,
            username: row.username,
            email: row.email,
            role: row.role,
            status: row.status,
            createdAt: row.created_at, // Transform
            updatedAt: row.updated_at, // Transform
        }));


        sendApiResponse(res, true, transformedUsers, undefined, 200);

    } catch (error) {
        console.error('Get all users error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to fetch users', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin']); // This endpoint requires 'admin' role

