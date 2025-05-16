// api/games/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { Game } from '@/types/database.types'; // Import Game type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const gameId = parseInt(req.query.id as string, 10);

    if (isNaN(gameId)) {
        sendApiResponse(res, false, undefined, 'Invalid game ID', 400);
        return;
    }

    let connection;
    try {
        connection = await getConnection();

        if (req.method === 'GET') {
            // Allow any authenticated user to get a specific game
            const [rows] = await connection.execute('SELECT id, name, created_at, updated_at FROM games WHERE id = ?', [gameId]);
            const game = (rows as any)[0];

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
             const [dependentBatches] = await connection.execute('SELECT id FROM batches WHERE game_id = ?', [gameId]);
             if ((dependentBatches as any).length > 0) {
                 sendApiResponse(res, false, undefined, 'Cannot delete game: It is linked to existing batches.', 409); // Conflict
                 return;
             }


            const [result] = await connection.execute('DELETE FROM games WHERE id = ?', [gameId]);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Game endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process game request', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach, or player to view; only admin to delete
