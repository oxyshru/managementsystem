// api/batches/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { Batch } from '@/types/database.types'; // Import Batch type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const batchId = parseInt(req.query.id as string, 10);

    if (isNaN(batchId)) {
        sendApiResponse(res, false, undefined, 'Invalid batch ID', 400);
        return;
    }

    let connection;
    try {
        connection = await getConnection();

        // Fetch batch details
        const [rows] = await connection.execute('SELECT id, game_id, name, schedule, coach_id, created_at, updated_at FROM batches WHERE id = ?', [batchId]);
        const batch = (rows as any)[0];

        if (!batch) {
            sendApiResponse(res, false, undefined, 'Batch not found', 404);
            return;
        }

        // Allow admin, the assigned coach (by checking coach_id), or players in this batch to get batch data
        // Checking if a player is in a batch requires joining with session_attendance and training_sessions.
        // For simplicity in this demo, allow admin or the assigned coach to view/edit/delete.
        // Players can view via the /batches endpoint.
        const [batchRows] = await connection.execute('SELECT coach_id FROM batches WHERE id = ?', [session.batch_id]);
        const batch = (batchRows as any)[0];

        if (!batch) {
             // Should not happen if FK constraints are in place, but handle defensively
             sendApiResponse(res, false, undefined, 'Associated batch not found', 404);
             return;
        }

        if (req.user.role !== 'admin' && (req.user.role !== 'coach' || req.user.id !== batch.coach_id)) {
             sendApiResponse(res, false, undefined, 'Access Denied', 403);
             return;
        }


        if (req.method === 'GET') {
             sendApiResponse(res, true, batch as Batch, undefined, 200);

        } else if (req.method === 'PUT') {
            // Allow admin or the assigned coach (by checking coach_id) to update batch data
            if (req.user.role !== 'admin' && (req.user.role !== 'coach' || req.user.id !== batch.coach_id)) {
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
            }

            const { gameId, name, schedule, coachId } = req.body;
            const updateFields: string[] = [];
            const updateValues: any[] = [];

            if (gameId !== undefined) { updateFields.push('game_id = ?'); updateValues.push(gameId); }
            if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
            if (schedule !== undefined) { updateFields.push('schedule = ?'); updateValues.push(schedule); }
            if (coachId !== undefined) { updateFields.push('coach_id = ?'); updateValues.push(coachId || null); }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(batchId); // Add batch ID for the WHERE clause

            const sql = `UPDATE batches SET ${updateFields.join(', ')} WHERE id = ?`;
            const [result] = await connection.execute(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);


        } else if (req.method === 'DELETE') {
            // Allow admin or the assigned coach (by checking coach_id) to delete batch
            if (req.user.role !== 'admin' && (req.user.role !== 'coach' || req.user.id !== batch.coach_id)) {
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
            }

             // Optional: Check for dependencies (e.g., training sessions in this batch) before deleting
             const [dependentSessions] = await connection.execute('SELECT id FROM training_sessions WHERE batch_id = ?', [batchId]);
             if ((dependentSessions as any).length > 0) {
                 sendApiResponse(res, false, undefined, 'Cannot delete batch: It contains existing training sessions.', 409); // Conflict
                 return;
             }


            const [result] = await connection.execute('DELETE FROM batches WHERE id = ?', [batchId]);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Batch endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process batch request', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'coach']); // Allow admin or coach of the associated batch
