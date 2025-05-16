// api/games/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { Game } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const gameId = parseInt(req.query.id as string, 10);

    if (isNaN(gameId)) {
        sendApiResponse(res, false, undefined, 'Invalid game ID', 400);
        return;
    }

    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        if (req.method === 'GET') {
            // Allow any authenticated user to get a specific game
            const result = await client.query('SELECT id, name, created_at, updated_at FROM games WHERE id = $1', [gameId]);
            const game = result.rows[0];

            if (game) {
                sendApiResponse(res, true, game as Game, undefined, 200);
            } else {
                sendApiResponse(res, false, undefined, 'Game not found', 404);
            }

        } else if (req.method === 'DELETE') {
            // Only allow admin to delete games
            if (req.user.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

             // Optional: Check for dependencies (e.g., batches using this game) before deleting
             const dependentBatchesResult = await client.query('SELECT id FROM batches WHERE game_id = $1', [gameId]);
             if (dependentBatchesResult.rows.length > 0) {
                 sendApiResponse(res, false, undefined, 'Cannot delete game: It is linked to existing batches.', 409); // Conflict
                 return;
             }


            const result = await client.query('DELETE FROM games WHERE id = $1', [gameId]);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200); // Use rowCount for affected rows

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Game endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process game request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach, or player to view; only admin to delete

