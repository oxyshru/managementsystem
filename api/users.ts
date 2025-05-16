// api/users.ts
// This file handles the GET all users endpoint
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from './utils/db'; // Corrected import path
import { sendApiResponse } from './utils/apiResponse'; // Corrected import path
import { authMiddleware } from './utils/authMiddleware'; // Corrected import path
import { User } from '@/types/database.types'; // Import User type

// Wrap the handler with authMiddleware, requiring 'admin' role for GET
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    if (req.method !== 'GET') {
        sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        return;
    }

    // The authMiddleware already checked for admin role, so we can proceed
    let connection;
    try {
        connection = await getConnection();

        // Fetch all users (excluding password)
        const [rows] = await connection.execute('SELECT id, username, email, role, status, created_at, updated_at FROM users');

        sendApiResponse(res, true, rows as User[], undefined, 200);

    } catch (error) {
        console.error('Get all users error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to fetch users', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin']); // This endpoint requires 'admin' role
