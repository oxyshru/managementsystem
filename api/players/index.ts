// api/players/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { Player } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    if (req.method !== 'GET') {
        sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        return;
    }

    // Allow coaches and admins to get all players
    if (req.user.role !== 'admin' && req.user.role !== 'coach') {
         sendApiResponse(res, false, undefined, 'Access Denied', 403);
         return;
    }


    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        // Fetch all players (simplified - does not include user info, stats, games, attendance)
        const result = await client.query('SELECT id, user_id, first_name, last_name, position, date_of_birth, height, weight, created_at, updated_at FROM players');

        sendApiResponse(res, true, result.rows as Player[], undefined, 200);

    } catch (error) {
        console.error('Get all players error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to fetch players', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach']); // This endpoint requires 'admin' or 'coach' role

