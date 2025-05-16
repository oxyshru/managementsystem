// api/player_stats.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from './utils/db';
import { sendApiResponse } from './utils/apiResponse';
import { authMiddleware } from './utils/authMiddleware';
import { PlayerStats, User } from '@/types/database.types';
import { PoolClient } from 'pg';

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: VercelRequest & { user?: Omit<User, 'password'> }, res: VercelResponse) => {
    let client: PoolClient | undefined;
    try {
        client = await getConnection();

        const playerStatsId = req.query.id ? parseInt(req.query.id as string, 10) : undefined;

        if (req.method === 'GET') {
            if (playerStatsId !== undefined) {
                // Handle GET /api/player_stats/:id
                const result = await client.query('SELECT id, player_id, games_played, goals_scored, assists, yellow_cards, red_cards, minutes_played, created_at, updated_at FROM player_stats WHERE id = $1', [playerStatsId]);
                const stats = result.rows[0];

                if (!stats) {
                    sendApiResponse(res, false, undefined, 'Player stats record not found', 404);
                    return;
                }

                // Check if the authenticated user is the player themselves (via player_id), their coach, or an admin
                const playerResult = await client.query('SELECT user_id FROM players WHERE id = $1', [stats.player_id]);
                const player = playerResult.rows[0];

                if (!player) {
                     sendApiResponse(res, false, undefined, 'Associated player not found', 404);
                     return;
                }

                 // Check if the user is the player themselves, their coach, or admin.
                 // Checking if a user is a coach *of this player* requires complex JOINs.
                 // For simplicity in this demo, allow admin, the player themselves, or any coach to view stats.
                 if (req.user?.role !== 'admin' && req.user?.role !== 'coach' && req.user.id !== player.user_id) {
                      sendApiResponse(res, false, undefined, 'Access Denied', 403);
                      return;
                 }

                sendApiResponse(res, true, stats as PlayerStats, undefined, 200);

            } else {
                // Handle GET /api/player_stats
                let sql = 'SELECT id, player_id, games_played, goals_scored, assists, yellow_cards, red_cards, minutes_played, created_at, updated_at FROM player_stats';
                const values: any[] = [];
                const conditions: string[] = [];
                let paramIndex = 1;

                if (req.user?.role === 'player') {
                     const playerResult = await client.query('SELECT id FROM players WHERE user_id = $1', [req.user.id]);
                     const player = playerResult.rows[0];

                     if (!player) {
                          sendApiResponse(res, false, undefined, 'Player profile not found', 404);
                          return;
                     }

                     conditions.push(`player_id = $${paramIndex++}`);
                     values.push(player.id);

                } else if (req.user?.role === 'coach') {
                     // Get stats for players in this coach's batches.
                     // This requires JOINs: player_stats -> players -> session_attendance -> training_sessions -> batches
                     // For simplicity, let's just get all player stats for now and note the complexity.
                     console.warn("Coach GET player_stats is simplified and returns all stats, not just for players in their batches.");
                      // A more accurate query would involve joins:
                      // conditions.push(`player_id IN (SELECT sa.player_id FROM session_attendance sa JOIN training_sessions ts ON sa.session_id = ts.id JOIN batches b ON ts.batch_id = b.id WHERE b.coach_id = $${paramIndex++})`);
                      // values.push(coach.id);
                } else if (req.user?.role !== 'admin') {
                     sendApiResponse(res, false, undefined, 'Access Denied', 403);
                     return;
                }

                if (req.user?.role !== 'player') {
                     if (req.query.playerId !== undefined) {
                          conditions.push(`player_id = $${paramIndex++}`);
                          values.push(req.query.playerId);
                     }
                }

                if (conditions.length > 0) {
                     sql += ' WHERE ' + conditions.join(' AND ');
                }

                sql += ' ORDER BY updated_at DESC';

                const result = await client.query(sql, values);
                sendApiResponse(res, true, result.rows as PlayerStats[], undefined, 200);
            }

        } else if (req.method === 'POST') {
            // Handle POST /api/player_stats
            if (req.user?.role !== 'admin' && req.user?.role !== 'coach') {
                sendApiResponse(res, false, undefined, 'Access Denied', 403);
                return;
            }

            const { playerId, gamesPlayed, goalsScored, assists, yellowCards, redCards, minutesPlayed } = req.body;

            if (!playerId) {
                sendApiResponse(res, false, undefined, 'Player ID is required for player stats', 400);
                return;
            }

            const result = await client.query(
                'INSERT INTO player_stats (player_id, games_played, goals_scored, assists, yellow_cards, red_cards, minutes_played) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                [playerId, gamesPlayed || 0, goalsScored || 0, assists || 0, yellowCards || 0, redCards || 0, minutesPlayed || 0]
            );
            const newStatsId = result.rows[0].id;

            sendApiResponse(res, true, { id: newStatsId }, undefined, 201);

        } else if (req.method === 'PUT') {
             // Handle PUT /api/player_stats/:id
             if (playerStatsId === undefined) {
                  sendApiResponse(res, false, undefined, 'Player stats ID is required for PUT method', 400);
                  return;
             }

             // Allow admin or the associated coach to update player stats
             const statsResult = await client.query('SELECT player_id FROM player_stats WHERE id = $1', [playerStatsId]);
             const stats = statsResult.rows[0];

             if (!stats) {
                 sendApiResponse(res, false, undefined, 'Player stats record not found', 404);
                 return;
             }

             // Check if the authenticated user is an admin or the coach of the associated player
             // Requires JOINs to check if the coach is assigned to this player's batch.
             // Simplified: Allow admin or any coach to update.
             if (req.user?.role !== 'admin' && req.user?.role !== 'coach') {
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
             }

            const { gamesPlayed, goalsScored, assists, yellowCards, redCards, minutesPlayed } = req.body;
            const updateFields: string[] = [];
            const updateValues: any[] = [];
             let paramIndex = 1;

            if (gamesPlayed !== undefined) { updateFields.push(`games_played = $${paramIndex++}`); updateValues.push(gamesPlayed); }
            if (goalsScored !== undefined) { updateFields.push(`goals_scored = $${paramIndex++}`); updateValues.push(goalsScored); }
            if (assists !== undefined) { updateFields.push(`assists = $${paramIndex++}`); updateValues.push(assists); }
            if (yellowCards !== undefined) { updateFields.push(`yellow_cards = $${paramIndex++}`); updateValues.push(yellowCards); }
            if (redCards !== undefined) { updateFields.push(`red_cards = $${paramIndex++}`); updateValues.push(redCards); }
            if (minutesPlayed !== undefined) { updateFields.push(`minutes_played = $${paramIndex++}`); updateValues.push(minutesPlayed); }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(playerStatsId);

            const sql = `UPDATE player_stats SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
            const result = await client.query(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200);


        } else if (req.method === 'DELETE') {
             // Handle DELETE /api/player_stats/:id
             if (playerStatsId === undefined) {
                  sendApiResponse(res, false, undefined, 'Player stats ID is required for DELETE method', 400);
                  return;
             }
            // Only allow admin to delete player stats records
            if (req.user?.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const result = await client.query('DELETE FROM player_stats WHERE id = $1', [playerStatsId]);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200);

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Player stats endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process player stats request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin (all methods), coach (GET, POST, PUT), player (GET their own)
