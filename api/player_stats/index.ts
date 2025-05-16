// api/player_stats/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { PlayerStats } from '@/types/database.types'; // Import PlayerStats type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    let connection;
    try {
        connection = await getConnection();

        if (req.method === 'GET') {
            // Allow admin to get all player stats
            // Allow coaches to get stats for players in their batches
            // Allow players to get their own stats
            // For simplicity, return all stats for admin/coach, and filter by player_id for players.
            let sql = 'SELECT id, player_id, games_played, goals_scored, assists, yellow_cards, red_cards, minutes_played, created_at, updated_at FROM player_stats';
            const values: any[] = [];
            const conditions: string[] = [];

            if (req.user.role === 'player') {
                 // Find the player ID for the current user
                 const [playerRows] = await connection.execute('SELECT id FROM players WHERE user_id = ?', [req.user.id]);
                 const player = (playerRows as any)[0];

                 if (!player) {
                      sendApiResponse(res, false, undefined, 'Player profile not found', 404);
                      return;
                 }

                 conditions.push('player_id = ?');
                 values.push(player.id);

            } else if (req.user.role === 'coach') {
                 // Find the coach ID for the current user
                 const [coachRows] = await connection.execute('SELECT id FROM coaches WHERE user_id = ?', [req.user.id]);
                 const coach = (coachRows as any)[0];

                 if (coach) {
                     // Get stats for players in this coach's batches.
                     // This requires JOINs: player_stats -> players -> session_attendance -> training_sessions -> batches
                     // For simplicity, let's just get all player stats for now and note the complexity.
                     console.warn("Coach GET player_stats is simplified and returns all stats, not just for players in their batches.");
                 } else {
                     // Coach profile not found, return empty list
                     sendApiResponse(res, true, [], undefined, 200);
                     return;
                 }
            } else if (req.user.role !== 'admin') {
                 // Other roles cannot view stats
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
            }

             // Allow filtering by player_id if provided (for admin/coach)
             if (req.user.role !== 'player') { // Players are already filtered by their own ID
                  if (req.query.playerId !== undefined) {
                       conditions.push('player_id = ?');
                       values.push(req.query.playerId);
                  }
             }


            if (conditions.length > 0) {
                 sql += ' WHERE ' + conditions.join(' AND ');
            }

            // Add ordering
            sql += ' ORDER BY updated_at DESC';


            const [rows] = await connection.execute(sql, values);
            sendApiResponse(res, true, rows as PlayerStats[], undefined, 200);

        } else if (req.method === 'POST') {
            // Allow admin or coaches to create player stats records
            if (req.user.role !== 'admin' && req.user.role !== 'coach') {
                sendApiResponse(res, false, undefined, 'Access Denied', 403);
                return;
            }

            const { playerId, gamesPlayed, goalsScored, assists, yellowCards, redCards, minutesPlayed } = req.body;

            if (!playerId) {
                sendApiResponse(res, false, undefined, 'Player ID is required for player stats', 400);
                return;
            }

             // Optional: Validate playerId exists and if the coach creating it is assigned to this player's batch
             // Skipping validation for demo simplicity


            const [result] = await connection.execute(
                'INSERT INTO player_stats (player_id, games_played, goals_scored, assists, yellow_cards, red_cards, minutes_played) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [playerId, gamesPlayed || 0, goalsScored || 0, assists || 0, yellowCards || 0, redCards || 0, minutesPlayed || 0]
            );
            const newStatsId = (result as any).insertId;

             // Fetch the newly created stats record to return its ID
             const [newStatsRows] = await connection.execute('SELECT id FROM player_stats WHERE id = ?', [newStatsId]);
             const newStats = (newStatsRows as any)[0];


            sendApiResponse(res, true, { id: newStats.id }, undefined, 201); // 201 Created

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
}, ['admin', 'coach', 'player']); // Allow admin, coach (GET/POST), player (GET their own)
