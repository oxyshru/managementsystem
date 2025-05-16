// api/batches/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { Batch } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        if (req.method === 'GET') {
            // Allow any authenticated user to get the list of batches
            // Coaches might want their own batches, players might want batches for their sports
            // For simplicity, return all batches for now. Filtering can be added via query params.
            const result = await client.query('SELECT id, game_id, name, schedule, coach_id, created_at, updated_at FROM batches');
            sendApiResponse(res, true, result.rows as Batch[], undefined, 200);

        } else if (req.method === 'POST') {
            // Only allow admin to add new batches
            if (req.user.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const { gameId, name, schedule, coachId } = req.body;

            if (!gameId || !name || !schedule) {
                sendApiResponse(res, false, undefined, 'Game ID, name, and schedule are required for batch', 400);
                return;
            }

             // Optional: Validate gameId and coachId exist
             // Skipping validation for demo simplicity


            const result = await client.query(
                'INSERT INTO batches (game_id, name, schedule, coach_id) VALUES ($1, $2, $3, $4) RETURNING id', // Use $n placeholders and RETURNING
                [gameId, name, schedule, coachId || null] // coachId can be null
            );
            const newBatchId = result.rows[0].id; // Get the inserted ID

             // Fetch the newly created batch to return its ID (optional, can just return the ID)
             // const newBatchResult = await client.query('SELECT id FROM batches WHERE id = $1', [newBatchId]);
             // const newBatch = newBatchResult.rows[0];


            sendApiResponse(res, true, { id: newBatchId }, undefined, 201); // 201 Created

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
}, ['admin', 'coach', 'player']); // Allow admin, coach, or player to view; only admin to add

