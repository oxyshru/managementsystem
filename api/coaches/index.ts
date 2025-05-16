// api/coaches/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { Coach } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    if (req.method !== 'GET') {
        sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        return;
    }

    // Allow admin, coach, or player (to see available coaches) to get all coaches
    // Coaches can see other coaches, players can see coaches for enrollment/info
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.role !== 'player') {
         sendApiResponse(res, false, undefined, 'Access Denied', 403);
         return;
    }


    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        // Fetch all coaches (simplified - does not include user info)
        const result = await client.query('SELECT id, user_id, first_name, last_name, specialization, experience, created_at, updated_at FROM coaches');

        sendApiResponse(res, true, result.rows as Coach[], undefined, 200);

    } catch (error) {
        console.error('Get all coaches error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to fetch coaches', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach, or player

