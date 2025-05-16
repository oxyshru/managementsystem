// api/coaches/[id]/players.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../../_utils/db';
import { sendApiResponse } from '../../_utils/apiResponse';
import { authMiddleware } from '../../_utils/authMiddleware';
import { Player } from '@/types/database.types'; // Import Player type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const coachId = parseInt(req.query.id as string, 10);

    if (isNaN(coachId)) {
        sendApiResponse(res, false, undefined, 'Invalid coach ID', 400);
        return;
    }

    if (req.method !== 'GET') {
        sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        return;
    }

    // Allow admin to get players for any coach
    // Allow a coach to get players assigned to their batches
    if (req.user.role !== 'admin') {
         // Find the coach profile for the current user
         const [coachRows] = await connection.execute('SELECT id FROM coaches WHERE user_id = ?', [req.user.id]);
         const requestingCoach = (coachRows as any)[0];

         if (!requestingCoach || requestingCoach.id !== coachId) {
              sendApiResponse(res, false, undefined, 'Access Denied', 403);
              return;
         }
    }


    let connection;
    try {
        connection = await getConnection();

        // --- Complex Query Needed Here ---
        // To get players *for this coach*, you'd typically:
        // 1. Find batches assigned to this coach (batches.coach_id = coachId)
        // 2. Find training sessions within those batches (training_sessions.batch_id IN (...batchIds))
        // 3. Find players who attended those sessions (session_attendance.session_id IN (...sessionIds))
        // 4. Fetch player details for those player IDs.
        // 5. Augment player data with attendance stats based on session_attendance for this coach's sessions.

        // Simplified Query for Demo: Just return all players for now.
        // This does NOT reflect players specific to the coach's batches.
        // Implementing the full logic requires complex SQL joins or multiple queries.

        console.warn(`Fetching players for coach ${coachId} is simplified in this demo backend. Returning all players.`);
        const [rows] = await connection.execute('SELECT id, user_id, first_name, last_name, position, date_of_birth, height, weight, created_at, updated_at FROM players');

        // In a real app, you would perform the JOINs and aggregation here
        // to calculate attendance % and last attendance for this coach's sessions.
        // The frontend currently simulates this augmentation based on mock data.
        // If the backend provided this, the frontend coach dashboard would use it.

        sendApiResponse(res, true, rows as Player[], undefined, 200);

    } catch (error) {
        console.error('Get players for coach error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to fetch players for coach', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'coach']); // Allow admin or coach
