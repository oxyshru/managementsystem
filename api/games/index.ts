// api/games/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { Game } from '@/types/database.types'; // Import Game type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    let connection;
    try {
        connection = await getConnection();

        if (req.method === 'GET') {
            // Allow any authenticated user to get the list of games
            const [rows] = await connection.execute('SELECT id, name, created_at, updated_at FROM games');
            sendApiResponse(res, true, rows as Game[], undefined, 200);

        } else if (req.method === 'POST') {
            // Only allow admin to add new games
            if (req.user.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const { name } = req.body;

            if (!name) {
                sendApiResponse(res, false, undefined, 'Game name is required', 400);
                return;
            }

            // Check if game name already exists
            const [existingGames] = await connection.execute('SELECT id FROM games WHERE name = ?', [name]);
            if ((existingGames as any).length > 0) {
                sendApiResponse(res, false, undefined, 'Game with this name already exists', 409);
                return;
            }

            const [result] = await connection.execute('INSERT INTO games (name) VALUES (?)', [name]);
            const newGameId = (result as any).insertId;

             // Fetch the newly created game to return its ID
             const [newGameRows] = await connection.execute('SELECT id FROM games WHERE id = ?', [newGameId]);
             const newGame = (newGameRows as any)[0];


            sendApiResponse(res, true, { id: newGame.id }, undefined, 201); // 201 Created

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Games endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process games request', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach, or player to view; only admin to add
