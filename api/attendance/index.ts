// api/attendance/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { Attendance } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        if (req.method === 'GET') {
            // Allow admin to get all attendance
            // Allow coaches to get attendance for their sessions/players
            // Allow players to get their own attendance
            // For simplicity, return all attendance for admin/coach, and filter by player_id for players.
            let sql = 'SELECT id, session_id, player_id, status, comments, created_at, updated_at FROM session_attendance';
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
                     // Get attendance for sessions associated with this coach's batches
                     conditions.push(`session_id IN (SELECT ts.id FROM training_sessions ts JOIN batches b ON ts.batch_id = b.id WHERE b.coach_id = $${paramIndex++})`);
                     values.push(coach.id);
                 } else {
                     // Coach profile not found, return empty list
                     sendApiResponse(res, true, [], undefined, 200);
                     return;
                 }
            } else if (req.user.role !== 'admin') {
                 // Other roles cannot view attendance
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
            }

             // Allow filtering by session_id or player_id if provided (for admin/coach)
             if (req.user.role !== 'player') { // Players are already filtered by their own ID
                  if (req.query.sessionId !== undefined) {
                       conditions.push(`session_id = $${paramIndex++}`);
                       values.push(req.query.sessionId);
                  }
                   if (req.query.playerId !== undefined) {
                       conditions.push(`player_id = $${paramIndex++}`);
                       values.push(req.query.playerId);
                   }
             }


            if (conditions.length > 0) {
                 sql += ' WHERE ' + conditions.join(' AND ');
            }

            // Add ordering
            sql += ' ORDER BY created_at DESC';


            const result = await client.query(sql, values);
            sendApiResponse(res, true, result.rows as Attendance[], undefined, 200);

        } else if (req.method === 'POST') {
            // Allow admin or coaches to record attendance
            if (req.user.role !== 'admin' && req.user.role !== 'coach') {
                sendApiResponse(res, false, undefined, 'Access Denied', 403);
                return;
            }

            const { sessionId, playerId, status, comments } = req.body;

            if (!sessionId || !playerId || !status) {
                sendApiResponse(res, false, undefined, 'Session ID, Player ID, and status are required for attendance', 400);
                return;
            }

             // Optional: Validate sessionId, playerId exist and if the coach recording is assigned to this session's batch
             // Skipping validation for demo simplicity


            const result = await client.query(
                'INSERT INTO session_attendance (session_id, player_id, status, comments) VALUES ($1, $2, $3, $4) RETURNING id', // Use $n placeholders and RETURNING id
                [sessionId, playerId, status, comments || null]
            );
            const newAttendanceId = result.rows[0].id; // Get the inserted ID

             // Fetch the newly created attendance record to return its ID (optional, can just return the ID)
             // const newAttendanceResult = await client.query('SELECT id FROM session_attendance WHERE id = $1', [newAttendanceId]);
             // const newAttendance = newAttendanceResult.rows[0];


            sendApiResponse(res, true, { id: newAttendanceId }, undefined, 201); // 201 Created

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Attendance endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process attendance request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach (GET/POST), player (GET their own)

