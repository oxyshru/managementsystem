// api/performance_notes/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { PerformanceNote } from '@/types/database.types'; // Assuming you add PerformanceNote to types

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    let connection;
    try {
        connection = await getConnection();

        if (req.method === 'GET') {
            // Allow admin to get all notes
            // Allow coaches to get notes they created or notes for players in their batches
            // Allow players to get notes about themselves
            // For simplicity, return all notes for admin/coach, and filter by player_id for players.
            let sql = 'SELECT id, player_id, coach_id, date, note, created_at, updated_at FROM performance_notes';
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
                     // Get notes created by this coach OR notes for players in their batches
                     // Getting players in their batches requires JOINs.
                     // For simplicity, let's just get notes created by this coach for now.
                     conditions.push('coach_id = ?');
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
                       conditions.push('player_id = ?');
                       values.push(req.query.playerId);
                  }
                   if (req.query.coachId !== undefined) {
                       conditions.push('coach_id = ?');
                       values.push(req.query.coachId);
                   }
             }


            if (conditions.length > 0) {
                 sql += ' WHERE ' + conditions.join(' AND ');
            }

            // Add ordering
            sql += ' ORDER BY date DESC, created_at DESC';


            const [rows] = await connection.execute(sql, values);
            sendApiResponse(res, true, rows as PerformanceNote[], undefined, 200);

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
                  const [coachRows] = await connection.execute('SELECT id FROM coaches WHERE user_id = ?', [req.user.id]);
                  actualCoachId = (coachRows as any)[0]?.id || null;
             }
             // If admin is creating, they might specify coachId or leave it null


             // Optional: Validate playerId exists and if the coach (if specified) exists and is assigned to this player's batch
             // Skipping validation for demo simplicity


            const [result] = await connection.execute(
                'INSERT INTO performance_notes (player_id, coach_id, date, note) VALUES (?, ?, ?, ?)',
                [playerId, actualCoachId, date, note]
            );
            const newNoteId = (result as any).insertId;

             // Fetch the newly created note to return its ID
             const [newNoteRows] = await connection.execute('SELECT id FROM performance_notes WHERE id = ?', [newNoteId]);
             const newNote = (newNoteRows as any)[0];


            sendApiResponse(res, true, { id: newNote.id }, undefined, 201); // 201 Created

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Performance notes endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process performance notes request', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach (GET/POST), player (GET their own)
