// api/payments.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from './utils/db';
import { sendApiResponse } from './utils/apiResponse';
import { authMiddleware } from './utils/authMiddleware';
import { Payment, User } from '../src/types/database.types';
import { PoolClient } from 'pg';

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: VercelRequest & { user?: Omit<User, 'password'> }, res: VercelResponse) => {
    let client: PoolClient | undefined;
    try {
        client = await getConnection();

        const paymentId = req.query.id ? parseInt(req.query.id as string, 10) : undefined;

        if (req.method === 'GET') {
            if (paymentId !== undefined) {
                // Handle GET /api/payments/:id
                const result = await client.query('SELECT id, player_id, date, amount, description, created_at, updated_at FROM payments WHERE id = $1', [paymentId]);
                const payment = result.rows[0];

                if (!payment) {
                    sendApiResponse(res, false, undefined, 'Payment not found', 404);
                    return;
                }

                // Allow admin to get any payment
                // Allow the player whose payment it is (by checking player_id -> user_id) to get their payment
                if (req.user?.role !== 'admin') {
                     const playerResult = await client.query('SELECT id FROM players WHERE user_id = $1', [req.user?.id]);
                     const player = playerResult.rows[0];

                     if (!player || player.id !== payment.player_id) {
                          sendApiResponse(res, false, undefined, 'Access Denied', 403);
                          return;
                     }
                }

                 // Transform snake_case from DB to camelCase for frontend
                const transformedPayment: Payment = {
                    id: payment.id,
                    playerId: payment.player_id,   // Transform
                    date: payment.date,
                    amount: payment.amount,
                    description: payment.description,
                    createdAt: payment.created_at, // Transform
                    updatedAt: payment.updated_at, // Transform
                };

                sendApiResponse(res, true, transformedPayment, undefined, 200);

            } else {
                // Handle GET /api/payments
                let sql = 'SELECT id, player_id, date, amount, description, created_at, updated_at FROM payments';
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
                     // Coaches can get payments for players in their batches (requires JOINs)
                     // Simplified: Coaches cannot view payments via this endpoint for now.
                     sendApiResponse(res, false, undefined, 'Access Denied', 403);
                     return;
                } else if (req.user?.role !== 'admin') {
                     sendApiResponse(res, false, undefined, 'Access Denied', 403);
                     return;
                }

                if (req.user?.role === 'admin') {
                     if (req.query.playerId !== undefined) {
                          conditions.push(`player_id = $${paramIndex++}`);
                          values.push(req.query.playerId);
                     }
                }

                if (conditions.length > 0) {
                     sql += ' WHERE ' + conditions.join(' AND ');
                }

                sql += ' ORDER BY created_at DESC';

                const result = await client.query(sql, values);

                 // Transform snake_case from DB to camelCase for frontend
                const transformedPayments: Payment[] = result.rows.map(row => ({
                    id: row.id,
                    playerId: row.player_id,   // Transform
                    date: row.date,
                    amount: row.amount,
                    description: row.description,
                    createdAt: row.created_at, // Transform
                    updatedAt: row.updated_at, // Transform
                }));

                sendApiResponse(res, true, transformedPayments, undefined, 200);
            }

        } else if (req.method === 'POST') {
            // Handle POST /api/payments
            if (req.user?.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const { playerId, date, amount, description } = req.body;

            if (!playerId || !date || amount === undefined || !description) {
                sendApiResponse(res, false, undefined, 'Player ID, date, amount, and description are required for payment', 400);
                return;
            }

            const result = await client.query(
                'INSERT INTO payments (player_id, date, amount, description) VALUES ($1, $2, $3, $4) RETURNING id',
                [playerId, date, amount, description]
            );
            const newPaymentId = result.rows[0].id;

            sendApiResponse(res, true, { id: newPaymentId }, undefined, 201);

        } else if (req.method === 'PUT') {
             // Handle PUT /api/payments/:id
             if (paymentId === undefined) {
                  sendApiResponse(res, false, undefined, 'Payment ID is required for PUT method', 400);
                  return;
             }

             // Only allow admin to update payments
             if (req.user?.role !== 'admin') {
                 sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                 return;
             }

            const { playerId, date, amount, description } = req.body;
            const updateFields: string[] = [];
            const updateValues: any[] = [];
             let paramIndex = 1;

            if (playerId !== undefined) { updateFields.push(`player_id = $${paramIndex++}`); updateValues.push(playerId); }
            if (date !== undefined) { updateFields.push(`date = $${paramIndex++}`); updateValues.push(date); }
            if (amount !== undefined) { updateFields.push(`amount = $${paramIndex++}`); updateValues.push(amount); }
            if (description !== undefined) { updateFields.push(`description = $${paramIndex++}`); updateValues.push(description); }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(paymentId);

            const sql = `UPDATE payments SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
            const result = await client.query(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200);


        } else if (req.method === 'DELETE') {
             // Handle DELETE /api/payments/:id
             if (paymentId === undefined) {
                  sendApiResponse(res, false, undefined, 'Payment ID is required for DELETE method', 400);
                  return;
             }
            // Only allow admin to delete payments
            if (req.user?.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const result = await client.query('DELETE FROM payments WHERE id = $1', [paymentId]);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200);

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Payments endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process payments request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'player']); // Allow admin (all methods), player (GET their own)

