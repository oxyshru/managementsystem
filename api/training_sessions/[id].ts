// api/training_sessions/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { TrainingSession } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const sessionId = parseInt(req.query.id as string, 10);

    if (isNaN(sessionId)) {
        sendApiResponse(res, false, undefined, 'Invalid training session ID', 400);
        return;
    }

    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        // Fetch training session details
        const result = await client.query('SELECT id, batch_id, title, description, date, duration, location, created_at, updated_at FROM training_sessions WHERE id = $1', [sessionId]);
        const session = result.rows[0];

        if (!session) {
            sendApiResponse(res, false, undefined, 'Training session not found', 404);
            return;
        }

        // Check if the authenticated user is an admin, the coach of the associated batch, or a player in the associated batch
        // This requires JOINing with batches and potentially session_attendance/player_games.
        // For simplicity in this demo, allow admin or the coach of the associated batch to view/edit/delete.
        // Players can view via the /training_sessions endpoint.
        const batchResult = await client.query('SELECT coach_id FROM batches WHERE id = $1', [session.batch_id]);
        const batch = batchResult.rows[0];

        if (!batch) {
             // Should not happen if FK constraints are in place, but handle defensively
             sendApiResponse(res, false, undefined, 'Associated batch not found', 404);
             return;
        }

         // Fetch the user_id for the assigned coach if coach_id is not null
         let assignedCoachUserId = null;
         if (batch.coach_id !== null) {
             const coachUserResult = await client.query('SELECT user_id FROM coaches WHERE id = $1', [batch.coach_id]);
             assignedCoachUserId = coachUserResult.rows[0]?.user_id || null;
         }


        if (req.user.role !== 'admin' && (req.user.role !== 'coach' || req.user.id !== assignedCoachUserId)) {
             sendApiResponse(res, false, undefined, 'Access Denied', 403);
             return;
        }


        if (req.method === 'GET') {
             sendApiResponse(res, true, session as TrainingSession, undefined, 200);

        } else if (req.method === 'PUT') {
            // Allow admin or the coach of the associated batch to update the session
            if (req.user.role !== 'admin' && (req.user.role !== 'coach' || req.user.id !== assignedCoachUserId)) {
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
            }

            const { batchId, title, description, date, duration, location } = req.body;
            const updateFields: string[] = [];
            const updateValues: any[] = [];
             let paramIndex = 1;

            if (batchId !== undefined) { updateFields.push(`batch_id = $${paramIndex++}`); updateValues.push(batchId); }
            if (title !== undefined) { updateFields.push(`title = $${paramIndex++}`); updateValues.push(title); }
            if (description !== undefined) { updateFields.push(`description = $${paramIndex++}`); updateValues.push(description); }
            if (date !== undefined) { updateFields.push(`date = $${paramIndex++}`); updateValues.push(date); }
            if (duration !== undefined) { updateFields.push(`duration = $${paramIndex++}`); updateValues.push(duration); }
            if (location !== undefined) { updateFields.push(`location = $${paramIndex++}`); updateValues.push(location); }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(sessionId); // Add session ID for the WHERE clause

            const sql = `UPDATE training_sessions SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
            const result = await client.query(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200); // Use rowCount for affected rows


        } else if (req.method === 'DELETE') {
            // Allow admin or the coach of the associated batch to delete the session
            if (req.user.role !== 'admin' && (req.user.role !== 'coach' || req.user.id !== assignedCoachUserId)) {
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
            }

             // Optional: Check for dependencies (e.g., attendance records for this session) before deleting
             const dependentAttendanceResult = await client.query('SELECT session_id FROM session_attendance WHERE session_id = $1', [sessionId]);
             if (dependentAttendanceResult.rows.length > 0) {
                 sendApiResponse(res, false, undefined, 'Cannot delete session: It has associated attendance records.', 409); // Conflict
                 return;
             }


            const result = await client.query('DELETE FROM training_sessions WHERE id = $1', [sessionId]);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200); // Use rowCount for affected rows

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Training session endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process training session request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach']); // Allow admin or coach of the associated batch

