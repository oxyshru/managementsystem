// api/players/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { Player } from '@/types/database.types'; // Import Player type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const playerId = parseInt(req.query.id as string, 10);

    if (isNaN(playerId)) {
        sendApiResponse(res, false, undefined, 'Invalid player ID', 400);
        return;
    }

    let connection;
    try {
        connection = await getConnection();

        // Fetch player details (simplified - does not include user info, stats, games, attendance)
        const [rows] = await connection.execute('SELECT id, user_id, first_name, last_name, position, date_of_birth, height, weight, created_at, updated_at FROM players WHERE id = ?', [playerId]);
        const player = (rows as any)[0];

        if (!player) {
            sendApiResponse(res, false, undefined, 'Player not found', 404);
            return;
        }

        // Allow admin or the player themselves (by checking user_id) to get player data
        // Also allow coaches to view player details (simplified access control)
        if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== player.user_id) {
             sendApiResponse(res, false, undefined, 'Access Denied', 403);
             return;
        }


        if (req.method === 'GET') {
             sendApiResponse(res, true, player as Player, undefined, 200);

        } else if (req.method === 'PUT') {
            // Allow admin or the player themselves (by checking user_id) to update player data
            if (req.user.role !== 'admin' && req.user.id !== player.user_id) {
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
            }

            const { firstName, lastName, position, dateOfBirth, height, weight, sports } = req.body;
            const updateFields: string[] = [];
            const updateValues: any[] = [];

            if (firstName !== undefined) { updateFields.push('first_name = ?'); updateValues.push(firstName); }
            if (lastName !== undefined) { updateFields.push('last_name = ?'); updateValues.push(lastName); }
            if (position !== undefined) { updateFields.push('position = ?'); updateValues.push(position); }
            if (dateOfBirth !== undefined) { updateFields.push('date_of_birth = ?'); updateValues.push(dateOfBirth); }
            if (height !== undefined) { updateFields.push('height = ?'); updateValues.push(height); }
            if (weight !== undefined) { updateFields.push('weight = ?'); updateValues.push(weight); }

             // Handling 'sports' (many-to-many) is complex. Skipping for this demo PUT.
             // In a real app, you'd update the player_games table here.
             if (sports !== undefined) {
                  console.warn("Updating 'sports' via /players/:id PUT is not fully implemented in this demo backend.");
                  // Logic to update player_games table would go here
             }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(playerId); // Add player ID for the WHERE clause

            const sql = `UPDATE players SET ${updateFields.join(', ')} WHERE id = ?`;
            const [result] = await connection.execute(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);


        } else if (req.method === 'DELETE') {
            // Only allow admin to delete players
            if (req.user.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const [result] = await connection.execute('DELETE FROM players WHERE id = ?', [playerId]);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Player endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process player request', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach, or player (for their own data)
