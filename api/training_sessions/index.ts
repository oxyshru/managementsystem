// api/training_sessions/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { TrainingSession } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        if (req.method === 'GET') {
            // Allow any authenticated user to get the list of training sessions
            // Coaches might want their own sessions, players might want sessions for their batches/sports
            // For simplicity, return all sessions for now. Filtering can be added via query params (e.g., by batch_id, coach_id).
            let sql = 'SELECT id, batch_id, title, description, date, duration, location, created_at, updated_at FROM training_sessions';
            const values: any[] = [];
            const conditions: string[] = [];
            let paramIndex = 1; // Start index for PostgreSQL placeholders

            // Example filtering by coach_id (if a coach is requesting their sessions)
            if (req.user.role === 'coach' && req.query.coachId === undefined) {
                 // If a coach requests sessions without a specific coachId param, assume they want their own
                 const coachResult = await client.query('SELECT id FROM coaches WHERE user_id = $1', [req.user.id]);
                 const coach = coachResult.rows[0];
                 if (coach) {
                     conditions.push(`batch_id IN (SELECT id FROM batches WHERE coach_id = $${paramIndex++})`);
                     values.push(coach.id);
                 } else {
                     // Coach profile not found, return empty list
                     sendApiResponse(res, true, [], undefined, 200);
                     return;
                 }
            } else if (req.query.coachId !== undefined) {
                 // Allow filtering by coachId if provided (e.g., for admin or other coaches)
                 conditions.push(`batch_id IN (SELECT id FROM batches WHERE coach_id = $${paramIndex++})`);
                 values.push(req.query.coachId);
            }

             // Example filtering by batch_id
             if (req.query.batchId !== undefined) {
                  conditions.push(`batch_id = $${paramIndex++}`);
                  values.push(req.query.batchId);
             }


            if (conditions.length > 0) {
                 sql += ' WHERE ' + conditions.join(' AND ');
            }

            // Add ordering (e.g., by date)
            sql += ' ORDER BY date ASC';


            const result = await client.query(sql, values);
            sendApiResponse(res, true, result.rows as TrainingSession[], undefined, 200);

        } else if (req.method === 'POST') {
            // Allow admin or coaches to add new training sessions
            if (req.user.role !== 'admin' && req.user.role !== 'coach') {
                sendApiResponse(res, false, undefined, 'Access Denied', 403);
                return;
            }

            const { batchId, title, description, date, duration, location } = req.body;

            if (!batchId || !date || !duration || !location) {
                sendApiResponse(res, false, undefined, 'Batch ID, date, duration, and location are required for training session', 400);
                return;
            }

             // Optional: Validate batchId exists and if the coach creating it is assigned to that batch
             // Skipping validation for demo simplicity


            const result = await client.query(
                'INSERT INTO training_sessions (batch_id, title, description, date, duration, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', // Use $n placeholders and RETURNING
                [batchId, title || null, description || null, date, duration, location]
            );
            const newSessionId = result.rows[0].id; // Get the inserted ID

             // Fetch the newly created session to return its ID (optional, can just return the ID)
             // const newSessionResult = await client.query('SELECT id FROM training_sessions WHERE id = $1', [newSessionId]);
             // const newSession = newSessionResult.rows[0];


            sendApiResponse(res, true, { id: newSessionId }, undefined, 201); // 201 Created

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Training sessions endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process training sessions request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach, player to view; admin, coach to add

