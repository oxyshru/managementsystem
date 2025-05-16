// api/batches/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { Batch } from '@/types/database.types'; // Import Batch type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    let connection;
    try {
        connection = await getConnection();

        if (req.method === 'GET') {
            // Allow any authenticated user to get the list of batches
            // Coaches might want their own batches, players might want batches for their sports
            // For simplicity, return all batches for now. Filtering can be added via query params.
            const [rows] = await connection.execute('SELECT id, game_id, name, schedule, coach_id, created_at, updated_at FROM batches');
            sendApiResponse(res, true, rows as Batch[], undefined, 200);

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


            const [result] = await connection.execute(
                'INSERT INTO batches (game_id, name, schedule, coach_id) VALUES (?, ?, ?, ?)',
                [gameId, name, schedule, coachId || null] // coachId can be null
            );
            const newBatchId = (result as any).insertId;

             // Fetch the newly created batch to return its ID
             const [newBatchRows] = await connection.execute('SELECT id FROM batches WHERE id = ?', [newBatchId]);
             const newBatch = (newBatchRows as any)[0];


            sendApiResponse(res, true, { id: newBatch.id }, undefined, 201); // 201 Created

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Batches endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process batches request', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach, or player to view; only admin to add
