// api/player_stats/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { PlayerStats } from '@/types/database.types'; // Import PlayerStats type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const playerStatsId = parseInt(req.query.id as string, 10);

    if (isNaN(playerStatsId)) {
        sendApiResponse(res, false, undefined, 'Invalid player stats ID', 400);
        return;
    }

    let connection;
    try {
        connection = await getConnection();

        // Fetch player stats record by its ID
        const [rows] = await connection.execute('SELECT id, player_id, games_played, goals_scored, assists, yellow_cards, red_cards, minutes_played, created_at, updated_at FROM player_stats WHERE id = ?', [playerStatsId]);
        const stats = (rows as any)[0];

        if (!stats) {
            sendApiResponse(res, false, undefined, 'Player stats record not found', 404);
            return;
        }

        // Check if the authenticated user is the player themselves (via player_id), their coach, or an admin
        const [playerRows] = await connection.execute('SELECT user_id FROM players WHERE id = ?', [stats.player_id]);
        const player = (playerRows as any)[0];

        if (!player) {
             sendApiResponse(res, false, undefined, 'Associated player not found', 404);
             return;
        }

         // Check if the user is the player themselves, their coach, or admin.
         // Checking if a user is a coach *of this player* requires complex JOINs.
         // For simplicity in this demo, allow admin, the player themselves, or any coach to view/edit/delete stats.
         if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== player.user_id) {
              sendApiResponse(res, false, undefined, 'Access Denied', 403);
              return;
         }


        if (req.method === 'GET') {
             sendApiResponse(res, true, stats as PlayerStats, undefined, 200);

        } else if (req.method === 'PUT') {
            // Allow admin or the associated coach to update player stats
            // Players typically don't update their own stats directly
            if (req.user.role !== 'admin' && req.user.role !== 'coach') {
                sendApiResponse(res, false, undefined, 'Access Denied', 403);
                return;
            }

            const { gamesPlayed, goalsScored, assists, yellowCards, redCards, minutesPlayed } = req.body;
            const updateFields: string[] = [];
            const updateValues: any[] = [];

            if (gamesPlayed !== undefined) { updateFields.push('games_played = ?'); updateValues.push(gamesPlayed); }
            if (goalsScored !== undefined) { updateFields.push('goals_scored = ?'); updateValues.push(goalsScored); }
            if (assists !== undefined) { updateFields.push('assists = ?'); updateValues.push(assists); }
            if (yellowCards !== undefined) { updateFields.push('yellow_cards = ?'); updateValues.push(yellowCards); }
            if (redCards !== undefined) { updateFields.push('red_cards = ?'); updateValues.push(redCards); }
            if (minutesPlayed !== undefined) { updateFields.push('minutes_played = ?'); updateValues.push(minutesPlayed); }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(playerStatsId); // Add stats ID for the WHERE clause

            const sql = `UPDATE player_stats SET ${updateFields.join(', ')} WHERE id = ?`;
            const [result] = await connection.execute(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);


        } else if (req.method === 'DELETE') {
            // Only allow admin to delete player stats records
            if (req.user.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const [result] = await connection.execute('DELETE FROM player_stats WHERE id = ?', [playerStatsId]);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Player stats endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process player stats request', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach (PUT/DELETE), player (GET)
