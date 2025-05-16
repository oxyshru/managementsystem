// api/coaches/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { Coach } from '@/types/database.types'; // Import Coach type

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


    let connection;
    try {
        connection = await getConnection();

        // Fetch all coaches (simplified - does not include user info)
        const [rows] = await connection.execute('SELECT id, user_id, first_name, last_name, specialization, experience, created_at, updated_at FROM coaches');

        sendApiResponse(res, true, rows as Coach[], undefined, 200);

    } catch (error) {
        console.error('Get all coaches error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to fetch coaches', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach, or player
