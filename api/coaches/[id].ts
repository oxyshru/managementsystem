// api/coaches/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { Coach } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const coachId = parseInt(req.query.id as string, 10);

    if (isNaN(coachId)) {
        sendApiResponse(res, false, undefined, 'Invalid coach ID', 400);
        return;
    }

    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        // Fetch coach details (simplified - does not include user info)
        const result = await client.query('SELECT id, user_id, first_name, last_name, specialization, experience, created_at, updated_at FROM coaches WHERE id = $1', [coachId]);
        const coach = result.rows[0];

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
             let paramIndex = 1;

            if (firstName !== undefined) { updateFields.push(`first_name = $${paramIndex++}`); updateValues.push(firstName); }
            if (lastName !== undefined) { updateFields.push(`last_name = $${paramIndex++}`); updateValues.push(lastName); }
            if (specialization !== undefined) { updateFields.push(`specialization = $${paramIndex++}`); updateValues.push(specialization); }
            if (experience !== undefined) { updateFields.push(`experience = $${paramIndex++}`); updateValues.push(experience); }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(coachId); // Add coach ID for the WHERE clause

            const sql = `UPDATE coaches SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
            const result = await client.query(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200); // Use rowCount for affected rows


        } else if (req.method === 'DELETE') {
            // Only allow admin to delete coaches
            if (req.user.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const result = await client.query('DELETE FROM coaches WHERE id = $1', [coachId]);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200); // Use rowCount for affected rows

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Coach endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process coach request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach, or player

