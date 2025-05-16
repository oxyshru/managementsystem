// api/performance_notes/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { PerformanceNote } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        if (req.method === 'GET') {
            // Allow admin to get all notes
            // Allow coaches to get notes they created or notes for players in their batches
            // Allow players to get notes about themselves
            // For simplicity, return all notes for admin/coach, and filter by player_id for players.
            let sql = 'SELECT id, player_id, coach_id, date, note, created_at, updated_at FROM performance_notes';
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
                     // Get notes created by this coach OR notes for players in their batches
                     // Getting players in their batches requires JOINs.
                     // For simplicity, let's just get notes created by this coach for now.
                     conditions.push(`coach_id = $${paramIndex++}`);
                     values.push(coach.id);
                     console.warn("Coach GET performance notes is simplified to only show notes created by the coach.");
                 } else {
                     // Coach profile not found, return empty list
                     sendApiResponse(res, true, [], undefined, 200);
                     return;
                 }
            } else if (req.user.role !== 'admin') {
                 // Other roles cannot view notes
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
            }

             // Allow filtering by player_id or coach_id if provided (for admin)
             if (req.user.role === 'admin') {
                  if (req.query.playerId !== undefined) {
                       conditions.push(`player_id = $${paramIndex++}`);
                       values.push(req.query.playerId);
                  }
                   if (req.query.coachId !== undefined) {
                       conditions.push(`coach_id = $${paramIndex++}`);
                       values.push(req.query.coachId);
                   }
             }


            if (conditions.length > 0) {
                 sql += ' WHERE ' + conditions.join(' AND ');
            }

            // Add ordering
            sql += ' ORDER BY date DESC, created_at DESC';


            const result = await client.query(sql, values);
            sendApiResponse(res, true, result.rows as PerformanceNote[], undefined, 200);

        } else if (req.method === 'POST') {
            // Allow admin or coaches to create performance notes
            if (req.user.role !== 'admin' && req.user.role !== 'coach') {
                sendApiResponse(res, false, undefined, 'Access Denied', 403);
                return;
            }

            const { playerId, date, note, coachId } = req.body; // coachId might be sent by frontend or derived from auth user

            if (!playerId || !date || !note) {
                sendApiResponse(res, false, undefined, 'Player ID, date, and note are required for performance note', 400);
                return;
            }

             // If coach is creating, use their ID as coachId
             let actualCoachId = coachId;
             if (req.user.role === 'coach') {
                  const coachResult = await client.query('SELECT id FROM coaches WHERE user_id = $1', [req.user.id]);
                  actualCoachId = coachResult.rows[0]?.id || null;
             }
             // If admin is creating, they might specify coachId or leave it null


             // Optional: Validate playerId exists and if the coach (if specified) exists and is assigned to this player's batch
             // Skipping validation for demo simplicity


            const result = await client.query(
                'INSERT INTO performance_notes (player_id, coach_id, date, note) VALUES ($1, $2, $3, $4) RETURNING id', // Use $n placeholders and RETURNING
                [playerId, actualCoachId, date, note]
            );
            const newNoteId = result.rows[0].id; // Get the inserted ID

             // Fetch the newly created note to return its ID (optional, can just return the ID)
             // const newNoteResult = await client.query('SELECT id FROM performance_notes WHERE id = $1', [newNoteId]);
             // const newNote = newNoteResult.rows[0];


            sendApiResponse(res, true, { id: newNoteId }, undefined, 201); // 201 Created

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Performance notes endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process performance notes request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach (GET/POST), player (GET their own)

