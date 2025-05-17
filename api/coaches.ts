// api/coaches.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from './utils/db';
import { sendApiResponse } from './utils/apiResponse';
import { authMiddleware } from './utils/authMiddleware';
import { Coach, User } from '../src/types/database.types';
import { PoolClient } from 'pg';

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: VercelRequest & { user?: Omit<User, 'password'> }, res: VercelResponse) => {
    let client: PoolClient | undefined;
    try {
        client = await getConnection();

        const coachId = req.query.id ? parseInt(req.query.id as string, 10) : undefined;
        const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined; // Added userId query param


        if (req.method === 'GET') {
            if (coachId !== undefined) {
                // Handle GET /api/coaches/:id
                const result = await client.query('SELECT id, user_id, first_name, last_name, specialization, experience, created_at, updated_at FROM coaches WHERE id = $1', [coachId]);
                const coach = result.rows[0];

                if (!coach) {
                    sendApiResponse(res, false, undefined, 'Coach not found', 404);
                    return;
                }

                // Allow admin or the coach themselves (by checking user_id) to get coach data
                // Also allow players to view coach details
                if (req.user?.role !== 'admin' && req.user?.role !== 'player' && req.user.id !== coach.user_id) {
                     sendApiResponse(res, false, undefined, 'Access Denied', 403);
                     return;
                }

                // Transform snake_case from DB to camelCase for frontend
                const transformedCoach: Coach = {
                    id: coach.id,
                    userId: coach.user_id,           // Transform
                    firstName: coach.first_name,     // Transform
                    lastName: coach.last_name,       // Transform
                    specialization: coach.specialization,
                    experience: coach.experience,
                    createdAt: coach.created_at,     // Transform
                    updatedAt: coach.updated_at,     // Transform
                };

                sendApiResponse(res, true, transformedCoach, undefined, 200);

            } else {
                // Handle GET /api/coaches
                // Allow admin, coach, or player (to see available coaches) to get all coaches
                if (req.user?.role !== 'admin' && req.user?.role !== 'coach' && req.user?.role !== 'player') {
                     sendApiResponse(res, false, undefined, 'Access Denied', 403);
                     return;
                }

                let sql = 'SELECT id, user_id, first_name, last_name, specialization, experience, created_at, updated_at FROM coaches';
                const values: any[] = [];
                const conditions: string[] = [];
                let paramIndex = 1;

                if (userId !== undefined) { // Filter by userId if provided
                     conditions.push(`user_id = $${paramIndex++}`);
                     values.push(userId);
                }

                if (conditions.length > 0) {
                    sql += ' WHERE ' + conditions.join(' AND ');
                }

                const result = await client.query(sql, values);

                 // Transform snake_case from DB to camelCase for frontend
                const transformedCoaches: Coach[] = result.rows.map(row => ({
                    id: row.id,
                    userId: row.user_id,           // Transform
                    firstName: row.first_name,     // Transform
                    lastName: row.last_name,       // Transform
                    specialization: row.specialization,
                    experience: row.experience,
                    createdAt: row.created_at,     // Transform
                    updatedAt: row.updated_at,     // Transform
                }));

                sendApiResponse(res, true, transformedCoaches, undefined, 200);
            }

        } else if (req.method === 'POST') {
            // Handle POST /api/coaches (assuming this is for creating coaches, though registration handles it)
             sendApiResponse(res, false, undefined, 'POST method not implemented for /api/coaches', 501); // Not Implemented

        } else if (req.method === 'PUT') {
             // Handle PUT /api/coaches/:id
             if (coachId === undefined) {
                  sendApiResponse(res, false, undefined, 'Coach ID is required for PUT method', 400);
                  return;
             }

             // Allow admin or the coach themselves (by checking user_id) to update coach data
             const coachResult = await client.query('SELECT user_id FROM coaches WHERE id = $1', [coachId]);
             const coach = coachResult.rows[0];

             if (!coach) {
                 sendApiResponse(res, false, undefined, 'Coach not found', 404);
                 return;
             }

             if (req.user?.role !== 'admin' && req.user.id !== coach.user_id) {
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
             }

            const { firstName, lastName, specialization, experience } = req.body;
            const updateFields: string[] = [];
            const updateValues: any[] = [];
             let paramIndex = 1;

            if (firstName !== undefined) { updateFields.push(`first_name = $${paramIndex++}`); updateValues.push(firstName); }
            if (lastName !== undefined) { updateFields.push(`last_name = $${paramIndex++}`); updateValues.push(lastName); }
            if (specialization !== undefined) { updateFields.push(`specialization = $${paramIndex++}`); updateValues.push(specialization); }
            if (experience !== undefined) { updateFields.push(`experience = $${paramIndex++}`); updateValues.push(experience); }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(coachId);

            const sql = `UPDATE coaches SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
            const result = await client.query(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200);


        } else if (req.method === 'DELETE') {
             // Handle DELETE /api/coaches/:id
             if (coachId === undefined) {
                  sendApiResponse(res, false, undefined, 'Coach ID is required for DELETE method', 400);
                  return;
             }
            // Only allow admin to delete coaches
            if (req.user?.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const result = await client.query('DELETE FROM coaches WHERE id = $1', [coachId]);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200);

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Coaches endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process coaches request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin (all methods), coach (GET, PUT, DELETE their own), player (GET all/by ID)

