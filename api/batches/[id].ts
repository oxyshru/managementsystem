// api/batches/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { Batch } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const batchId = parseInt(req.query.id as string, 10);

    if (isNaN(batchId)) {
        sendApiResponse(res, false, undefined, 'Invalid batch ID', 400);
        return;
    }

    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        // Fetch batch details
        const result = await client.query('SELECT id, game_id, name, schedule, coach_id, created_at, updated_at FROM batches WHERE id = $1', [batchId]);
        const batch = result.rows[0];

        if (!batch) {
            sendApiResponse(res, false, undefined, 'Batch not found', 404);
            return;
        }

        // Allow admin, the assigned coach (by checking coach_id), or players in this batch to get batch data
        // Checking if a player is in a batch requires joining with session_attendance and training_sessions.
        // For simplicity in this demo, allow admin or the assigned coach to view/edit/delete.
        // Players can view via the /batches endpoint.

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
             sendApiResponse(res, true, batch as Batch, undefined, 200);

        } else if (req.method === 'PUT') {
            // Allow admin or the assigned coach (by checking coach_id) to update batch data
            if (req.user.role !== 'admin' && (req.user.role !== 'coach' || req.user.id !== assignedCoachUserId)) {
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
            }

            const { gameId, name, schedule, coachId } = req.body;
            const updateFields: string[] = [];
            const updateValues: any[] = [];
             let paramIndex = 1;

            if (gameId !== undefined) { updateFields.push(`game_id = $${paramIndex++}`); updateValues.push(gameId); }
            if (name !== undefined) { updateFields.push(`name = $${paramIndex++}`); updateValues.push(name); }
            if (schedule !== undefined) { updateFields.push(`schedule = $${paramIndex++}`); updateValues.push(schedule); }
            if (coachId !== undefined) { updateFields.push(`coach_id = $${paramIndex++}`); updateValues.push(coachId || null); }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(batchId); // Add batch ID for the WHERE clause

            const sql = `UPDATE batches SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
            const result = await client.query(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200); // Use rowCount for affected rows


        } else if (req.method === 'DELETE') {
            // Allow admin or the assigned coach (by checking coach_id) to delete batch
            if (req.user.role !== 'admin' && (req.user.role !== 'coach' || req.user.id !== assignedCoachUserId)) {
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
            }

             // Optional: Check for dependencies (e.g., training sessions in this batch) before deleting
             const dependentSessionsResult = await client.query('SELECT id FROM training_sessions WHERE batch_id = $1', [batchId]);
             if (dependentSessionsResult.rows.length > 0) {
                 sendApiResponse(res, false, undefined, 'Cannot delete batch: It contains existing training sessions.', 409); // Conflict
                 return;
             }


            const result = await client.query('DELETE FROM batches WHERE id = $1', [batchId]);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200); // Use rowCount for affected rows

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Batch endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process batch request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach']); // Allow admin or coach of the associated batch

