// api/games.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from './utils/db';
import { sendApiResponse } from './utils/apiResponse';
import { authMiddleware } from './utils/authMiddleware';
import { Game, User } from '@/types/database.types';
import { PoolClient } from 'pg';

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: VercelRequest & { user?: Omit<User, 'password'> }, res: VercelResponse) => {
    let client: PoolClient | undefined;
    try {
        client = await getConnection();

        const gameId = req.query.id ? parseInt(req.query.id as string, 10) : undefined;

        if (req.method === 'GET') {
            if (gameId !== undefined) {
                // Handle GET /api/games/:id
                const result = await client.query('SELECT id, name, created_at, updated_at FROM games WHERE id = $1', [gameId]);
                const game = result.rows[0];

                if (game) {
                    sendApiResponse(res, true, game as Game, undefined, 200);
                } else {
                    sendApiResponse(res, false, undefined, 'Game not found', 404);
                }

            } else {
                // Handle GET /api/games
                // Allow any authenticated user to get the list of games
                const result = await client.query('SELECT id, name, created_at, updated_at FROM games');
                sendApiResponse(res, true, result.rows as Game[], undefined, 200);
            }

        } else if (req.method === 'POST') {
            // Handle POST /api/games
            if (req.user?.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const { name } = req.body;

            if (!name) {
                sendApiResponse(res, false, undefined, 'Game name is required', 400);
                return;
            }

            const existingGamesResult = await client.query('SELECT id FROM games WHERE LOWER(name) = LOWER($1)', [name]);
            if (existingGamesResult.rows.length > 0) {
                sendApiResponse(res, false, undefined, 'Game with this name already exists', 409);
                return;
            }

            const result = await client.query('INSERT INTO games (name) VALUES ($1) RETURNING id', [name]);
            const newGameId = result.rows[0].id;

            sendApiResponse(res, true, { id: newGameId }, undefined, 201);

        } else if (req.method === 'PUT') {
             // Handle PUT /api/games/:id (Allow admin to update game name)
             if (gameId === undefined) {
                  sendApiResponse(res, false, undefined, 'Game ID is required for PUT method', 400);
                  return;
             }

             if (req.user?.role !== 'admin') {
                 sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                 return;
             }

             const { name } = req.body;
             if (!name) {
                 sendApiResponse(res, false, undefined, 'Game name is required for update', 400);
                 return;
             }

             // Optional: Check if the new name already exists (excluding the current game)
             const existingGamesResult = await client.query('SELECT id FROM games WHERE LOWER(name) = LOWER($1) AND id != $2', [name, gameId]);
             if (existingGamesResult.rows.length > 0) {
                 sendApiResponse(res, false, undefined, 'Another game with this name already exists', 409);
                 return;
             }

             const result = await client.query('UPDATE games SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [name, gameId]);

             sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200);


        } else if (req.method === 'DELETE') {
             // Handle DELETE /api/games/:id
             if (gameId === undefined) {
                  sendApiResponse(res, false, undefined, 'Game ID is required for DELETE method', 400);
                  return;
             }
            // Only allow admin to delete games
            if (req.user?.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

             const dependentBatchesResult = await client.query('SELECT id FROM batches WHERE game_id = $1', [gameId]);
             if (dependentBatchesResult.rows.length > 0) {
                 sendApiResponse(res, false, undefined, 'Cannot delete game: It is linked to existing batches.', 409);
                 return;
             }

            const result = await client.query('DELETE FROM games WHERE id = $1', [gameId]);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200);

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
}, ['admin', 'coach', 'player']); // Allow admin (all methods), coach/player (GET)
