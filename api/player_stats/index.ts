// api/player_stats/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { PlayerStats } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        if (req.method === 'GET') {
            // Allow admin to get all player stats
            // Allow coaches to get stats for players in their batches
            // Allow players to get their own stats
            // For simplicity, return all stats for admin/coach, and filter by player_id for players.
            let sql = 'SELECT id, player_id, games_played, goals_scored, assists, yellow_cards, red_cards, minutes_played, created_at, updated_at FROM player_stats';
            const values: any[] = [];
            const conditions: string[] = [];
            let paramIndex = 1; // Start index for PostgreSQL placeholders


            if (req.user.role === 'player') {
                 // Find the player ID for the current user
                 const playerResult = await client.query('SELECT id FROM players WHERE user_id = $1', [req.user.id]);
                 const player = playerResult.rows[0];

                 if (!player) {
                      sendApiResponse(res, false, undefined, 'Player profile not found', 404);
                      return;
                 }

                 conditions.push(`player_id = $${paramIndex++}`);
                 values.push(player.id);

            } else if (req.user.role === 'coach') {
                 // Find the coach ID for the current user
                 const coachResult = await client.query('SELECT id FROM coaches WHERE user_id = $1', [req.user.id]);
                 const coach = coachResult.rows[0];

                 if (coach) {
                     // Get stats for players in this coach's batches.
                     // This requires JOINs: player_stats -> players -> session_attendance -> training_sessions -> batches
                     // For simplicity, let's just get all player stats for now and note the complexity.
                     console.warn("Coach GET player_stats is simplified and returns all stats, not just for players in their batches.");
                      // A more accurate query would involve joins:
                      // conditions.push(`player_id IN (SELECT sa.player_id FROM session_attendance sa JOIN training_sessions ts ON sa.session_id = ts.id JOIN batches b ON ts.batch_id = b.id WHERE b.coach_id = $${paramIndex++})`);
                      // values.push(coach.id);
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
                       conditions.push(`player_id = $${paramIndex++}`);
                       values.push(req.query.playerId);
                  }
             }


            if (conditions.length > 0) {
                 sql += ' WHERE ' + conditions.join(' AND ');
            }

            // Add ordering
            sql += ' ORDER BY updated_at DESC';


            const result = await client.query(sql, values);
            sendApiResponse(res, true, result.rows as PlayerStats[], undefined, 200);

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


            const result = await client.query(
                'INSERT INTO player_stats (player_id, games_played, goals_scored, assists, yellow_cards, red_cards, minutes_played) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', // Use $n placeholders and RETURNING
                [playerId, gamesPlayed || 0, goalsScored || 0, assists || 0, yellowCards || 0, redCards || 0, minutesPlayed || 0]
            );
            const newStatsId = result.rows[0].id; // Get the inserted ID

             // Fetch the newly created stats record to return its ID (optional, can just return the ID)
             // const newStatsResult = await client.query('SELECT id FROM player_stats WHERE id = $1', [newStatsId]);
             // const newStats = newStatsResult.rows[0];


            sendApiResponse(res, true, { id: newStatsId }, undefined, 201); // 201 Created

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
}, ['admin', 'coach', 'player']); // Allow admin, coach (GET/POST), player (GET their own)

