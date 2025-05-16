// api/training_sessions/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { TrainingSession } from '@/types/database.types'; // Import TrainingSession type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    let connection;
    try {
        connection = await getConnection();

        if (req.method === 'GET') {
            // Allow any authenticated user to get the list of training sessions
            // Coaches might want their own sessions, players might want sessions for their batches/sports
            // For simplicity, return all sessions for now. Filtering can be added via query params (e.g., by batch_id, coach_id).
            let sql = 'SELECT id, batch_id, title, description, date, duration, location, created_at, updated_at FROM training_sessions';
            const values: any[] = [];
            const conditions: string[] = [];

            // Example filtering by coach_id (if a coach is requesting their sessions)
            if (req.user.role === 'coach' && req.query.coachId === undefined) {
                 // If a coach requests sessions without a specific coachId param, assume they want their own
                 const [coachRows] = await connection.execute('SELECT id FROM coaches WHERE user_id = ?', [req.user.id]);
                 const coach = (coachRows as any)[0];
                 if (coach) {
                     conditions.push('batch_id IN (SELECT id FROM batches WHERE coach_id = ?)');
                     values.push(coach.id);
                 } else {
                     // Coach profile not found, return empty list
                     sendApiResponse(res, true, [], undefined, 200);
                     return;
                 }
            } else if (req.query.coachId !== undefined) {
                 // Allow filtering by coachId if provided (e.g., for admin or other coaches)
                 conditions.push('batch_id IN (SELECT id FROM batches WHERE coach_id = ?)');
                 values.push(req.query.coachId);
            }

             // Example filtering by batch_id
             if (req.query.batchId !== undefined) {
                  conditions.push('batch_id = ?');
                  values.push(req.query.batchId);
             }


            if (conditions.length > 0) {
                 sql += ' WHERE ' + conditions.join(' AND ');
            }

            // Add ordering (e.g., by date)
            sql += ' ORDER BY date ASC';


            const [rows] = await connection.execute(sql, values);
            sendApiResponse(res, true, rows as TrainingSession[], undefined, 200);

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


            const [result] = await connection.execute(
                'INSERT INTO training_sessions (batch_id, title, description, date, duration, location) VALUES (?, ?, ?, ?, ?, ?)',
                [batchId, title || null, description || null, date, duration, location]
            );
            const newSessionId = (result as any).insertId;

             // Fetch the newly created session to return its ID
             const [newSessionRows] = await connection.execute('SELECT id FROM training_sessions WHERE id = ?', [newSessionId]);
             const newSession = (newSessionRows as any)[0];


            sendApiResponse(res, true, { id: newSession.id }, undefined, 201); // 201 Created

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Training sessions endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process training sessions request', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach, player to view; admin, coach to add
