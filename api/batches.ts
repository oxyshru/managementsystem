// api/batches.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from './utils/db';
import { sendApiResponse } from './utils/apiResponse';
import { authMiddleware } from './utils/authMiddleware';
import { Batch, User } from '../types/database.types'; // Changed import path
import { PoolClient } from 'pg';

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: VercelRequest & { user?: Omit<User, 'password'> }, res: VercelResponse) => {
    let client: PoolClient | undefined;
    try {
        client = await getConnection();

        const batchId = req.query.id ? parseInt(req.query.id as string, 10) : undefined;

        if (req.method === 'GET') {
            if (batchId !== undefined) {
                // Handle GET /api/batches/:id
                const result = await client.query('SELECT id, game_id, name, schedule, coach_id, created_at, updated_at FROM batches WHERE id = $1', [batchId]);
                const batch = result.rows[0];

                if (!batch) {
                    sendApiResponse(res, false, undefined, 'Batch not found', 404);
                    return;
                }

                // Allow admin, the assigned coach (by checking coach_id), or players in this batch to get batch data
                 // Fetch the user_id for the assigned coach if coach_id is not null
                 let assignedCoachUserId = null;
                 if (batch.coach_id !== null) {
                     const coachUserResult = await client.query('SELECT user_id FROM coaches WHERE id = $1', [batch.coach_id]);
                     assignedCoachUserId = coachUserResult.rows[0]?.user_id || null;
                 }

                 // Check if the player is in this batch (requires joining through sessions and attendance/player_games)
                 // Simplified check: allow players to view any batch for now.
                 const isPlayerInBatch = req.user?.role === 'player'; // Simplified


                if (req.user?.role !== 'admin' && (req.user?.role !== 'coach' || req.user.id !== assignedCoachUserId) && !isPlayerInBatch) {
                     sendApiResponse(res, false, undefined, 'Access Denied', 403);
                     return;
                }

                sendApiResponse(res, true, batch as Batch, undefined, 200);

            } else {
                // Handle GET /api/batches
                // Allow any authenticated user to get the list of batches
                const result = await client.query('SELECT id, game_id, name, schedule, coach_id, created_at, updated_at FROM batches');
                sendApiResponse(res, true, result.rows as Batch[], undefined, 200);
            }

        } else if (req.method === 'POST') {
            // Handle POST /api/batches
            if (req.user?.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const { gameId, name, schedule, coachId } = req.body;

            if (!gameId || !name || !schedule) {
                sendApiResponse(res, false, undefined, 'Game ID, name, and schedule are required for batch', 400);
                return;
            }

            const result = await client.query(
                'INSERT INTO batches (game_id, name, schedule, coach_id) VALUES ($1, $2, $3, $4) RETURNING id',
                [gameId, name, schedule, coachId || null]
            );
            const newBatchId = result.rows[0].id;

            sendApiResponse(res, true, { id: newBatchId }, undefined, 201);

        } else if (req.method === 'PUT') {
             // Handle PUT /api/batches/:id
             if (batchId === undefined) {
                  sendApiResponse(res, false, undefined, 'Batch ID is required for PUT method', 400);
                  return;
             }

             // Allow admin or the assigned coach (by checking coach_id) to update batch data
             const batchResult = await client.query('SELECT coach_id FROM batches WHERE id = $1', [batchId]);
             const batch = batchResult.rows[0];

             if (!batch) {
                 sendApiResponse(res, false, undefined, 'Batch not found', 404);
                 return;
             }

             let assignedCoachUserId = null;
             if (batch.coach_id !== null) {
                 const coachUserResult = await client.query('SELECT user_id FROM coaches WHERE id = $1', [batch.coach_id]);
                 assignedCoachUserId = coachUserResult.rows[0]?.user_id || null;
             }

             if (req.user?.role !== 'admin' && (req.user?.role !== 'coach' || req.user.id !== assignedCoachUserId)) {
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
            updateValues.push(batchId);

            const sql = `UPDATE batches SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
            const result = await client.query(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200);


        } else if (req.method === 'DELETE') {
             // Handle DELETE /api/batches/:id
             if (batchId === undefined) {
                  sendApiResponse(res, false, undefined, 'Batch ID is required for DELETE method', 400);
                  return;
             }

             // Allow admin or the assigned coach (by checking coach_id) to delete batch
              const batchResult = await client.query('SELECT coach_id FROM batches WHERE id = $1', [batchId]);
              const batch = batchResult.rows[0];

              if (!batch) {
                  sendApiResponse(res, false, undefined, 'Batch not found', 404);
                  return;
              }

              let assignedCoachUserId = null;
              if (batch.coach_id !== null) {
                  const coachUserResult = await client.query('SELECT user_id FROM coaches WHERE id = $1', [batch.coach_id]);
                  assignedCoachUserId = coachUserResult.rows[0]?.user_id || null;
              }

             if (req.user?.role !== 'admin' && (req.user?.role !== 'coach' || req.user.id !== assignedCoachUserId)) {
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
             }

             const dependentSessionsResult = await client.query('SELECT id FROM training_sessions WHERE batch_id = $1', [batchId]);
             if (dependentSessionsResult.rows.length > 0) {
                 sendApiResponse(res, false, undefined, 'Cannot delete batch: It contains existing training sessions.', 409);
                 return;
             }

            const result = await client.query('DELETE FROM batches WHERE id = $1', [batchId]);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200);

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Batches endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process batches request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin (all methods), coach (GET, PUT, DELETE if assigned), player (GET)

