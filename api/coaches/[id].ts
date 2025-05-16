// api/coaches/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { Coach } from '@/types/database.types'; // Import Coach type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const coachId = parseInt(req.query.id as string, 10);

    if (isNaN(coachId)) {
        sendApiResponse(res, false, undefined, 'Invalid coach ID', 400);
        return;
    }

    let connection;
    try {
        connection = await getConnection();

        // Fetch coach details (simplified - does not include user info)
        const [rows] = await connection.execute('SELECT id, user_id, first_name, last_name, specialization, experience, created_at, updated_at FROM coaches WHERE id = ?', [coachId]);
        const coach = (rows as any)[0];

        if (!coach) {
            sendApiResponse(res, false, undefined, 'Coach not found', 404);
            return;
        }

        // Allow admin or the coach themselves (by checking user_id) to get coach data
        // Also allow players to view coach details
        if (req.user.role !== 'admin' && req.user.role !== 'player' && req.user.id !== coach.user_id) {
             sendApiResponse(res, false, undefined, 'Access Denied', 403);
             return;
        }


        if (req.method === 'GET') {
             sendApiResponse(res, true, coach as Coach, undefined, 200);

        } else if (req.method === 'PUT') {
            // Allow admin or the coach themselves (by checking user_id) to update coach data
            if (req.user.role !== 'admin' && req.user.id !== coach.user_id) {
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
            }

            const { firstName, lastName, specialization, experience } = req.body;
            const updateFields: string[] = [];
            const updateValues: any[] = [];

            if (firstName !== undefined) { updateFields.push('first_name = ?'); updateValues.push(firstName); }
            if (lastName !== undefined) { updateFields.push('last_name = ?'); updateValues.push(lastName); }
            if (specialization !== undefined) { updateFields.push('specialization = ?'); updateValues.push(specialization); }
            if (experience !== undefined) { updateFields.push('experience = ?'); updateValues.push(experience); }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(coachId); // Add coach ID for the WHERE clause

            const sql = `UPDATE coaches SET ${updateFields.join(', ')} WHERE id = ?`;
            const [result] = await connection.execute(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);


        } else if (req.method === 'DELETE') {
            // Only allow admin to delete coaches
            if (req.user.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const [result] = await connection.execute('DELETE FROM coaches WHERE id = ?', [coachId]);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Coach endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process coach request', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach, or player
