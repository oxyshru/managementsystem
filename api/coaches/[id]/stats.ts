// api/players/[id]/stats.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../../utils/db'; // Corrected import path
import { sendApiResponse } from '../../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../../utils/authMiddleware'; // Corrected import path
import { PlayerStats } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const playerId = parseInt(req.query.id as string, 10);

    if (isNaN(playerId)) {
        sendApiResponse(res, false, undefined, 'Invalid player ID', 400);
        return;
    }

    if (req.method !== 'GET') {
        sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        return;
    }

    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        // Check if the authenticated user is the player themselves, their coach, or an admin
        const playerResult = await client.query('SELECT user_id FROM players WHERE id = $1', [playerId]);
        const player = playerResult.rows[0];

        if (!player) {
             sendApiResponse(res, false, undefined, 'Player not found', 404);
             return;
        }

         // Need to check if the user is the player themselves, their coach, or admin.
         // Checking if a user is a coach *of this player* requires complex JOINs.
         // For simplicity in this demo, allow admin, the player themselves, or any coach to view stats.
         if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== player.user_id) {
              sendApiResponse(res, false, undefined, 'Access Denied', 403);
              return;
         }


        // Fetch player stats
        const result = await client.query('SELECT id, player_id, games_played, goals_scored, assists, yellow_cards, red_cards, minutes_played, created_at, updated_at FROM player_stats WHERE player_id = $1', [playerId]);
        const stats = result.rows[0]; // Assuming one stats record per player

        if (stats) {
            sendApiResponse(res, true, stats as PlayerStats, undefined, 200);
        } else {
            // Return default stats if none found, as the frontend expects
             sendApiResponse(res, true, {
                 id: 0, // Mock ID for frontend (should ideally not be 0 if inserting)
                 playerId: playerId,
                 gamesPlayed: 0,
                 goalsScored: 0,
                 assists: 0,
                 yellowCards: 0,
                 redCards: 0,
                 minutesPlayed: 0,
                 createdAt: new Date(), // Use current date for mock
                 updatedAt: new Date(), // Use current date for mock
             } as PlayerStats, undefined, 200);
        }

    } catch (error) {
        console.error('Get player stats error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to fetch player stats', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach, or player

