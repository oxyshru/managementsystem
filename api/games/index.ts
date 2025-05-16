// api/games/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { Game } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        if (req.method === 'GET') {
            // Allow any authenticated user to get the list of games
            const result = await client.query('SELECT id, name, created_at, updated_at FROM games');
            sendApiResponse(res, true, result.rows as Game[], undefined, 200);

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

            // Check if game name already exists (case-insensitive check in PostgreSQL)
            const existingGamesResult = await client.query('SELECT id FROM games WHERE LOWER(name) = LOWER($1)', [name]);
            if (existingGamesResult.rows.length > 0) {
                sendApiResponse(res, false, undefined, 'Game with this name already exists', 409);
                return;
            }

            const result = await client.query('INSERT INTO games (name) VALUES ($1) RETURNING id', [name]); // Use $n placeholders and RETURNING
            const newGameId = result.rows[0].id; // Get the inserted ID

             // Fetch the newly created game to return its ID (optional, can just return the ID)
             // const newGameResult = await client.query('SELECT id FROM games WHERE id = $1', [newGameId]);
             // const newGame = newGameResult.rows[0];


            sendApiResponse(res, true, { id: newGameId }, undefined, 201); // 201 Created

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Games endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process games request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach, or player to view; only admin to add

