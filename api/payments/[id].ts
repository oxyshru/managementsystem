// api/payments/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { Payment } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const paymentId = parseInt(req.query.id as string, 10);

    if (isNaN(paymentId)) {
        sendApiResponse(res, false, undefined, 'Invalid payment ID', 400);
        return;
    }

    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        // Fetch payment details
        const result = await client.query('SELECT id, player_id, date, amount, description, created_at, updated_at FROM payments WHERE id = $1', [paymentId]);
        const payment = result.rows[0];

        if (!payment) {
            sendApiResponse(res, false, undefined, 'Payment not found', 404);
            return;
        }

        // Allow admin to get/update/delete any payment
        // Allow the player whose payment it is (by checking player_id -> user_id) to get their payment
        if (req.user.role !== 'admin') {
             // Find the player ID for the current user
             const playerResult = await client.query('SELECT id FROM players WHERE user_id = $1', [req.user.id]);
             const player = playerResult.rows[0];

             if (!player || player.id !== payment.player_id) {
                  sendApiResponse(res, false, undefined, 'Access Denied', 403);
                  return;
             }
             // Players can only GET their own payments, not PUT/DELETE
             if (req.method !== 'GET') {
                  sendApiResponse(res, false, undefined, 'Access Denied', 403);
                  return;
             }
        }


        if (req.method === 'GET') {
             sendApiResponse(res, true, payment as Payment, undefined, 200);

        } else if (req.method === 'PUT') {
            // Only allow admin to update payments
            if (req.user.role !== 'admin') {
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
            updateValues.push(paymentId); // Add payment ID for the WHERE clause

            const sql = `UPDATE payments SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
            const result = await client.query(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200); // Use rowCount for affected rows


        } else if (req.method === 'DELETE') {
            // Only allow admin to delete payments
            if (req.user.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const result = await client.query('DELETE FROM payments WHERE id = $1', [paymentId]);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200); // Use rowCount for affected rows

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Payment endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process payment request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'player']); // Allow admin (all methods), player (GET their own)

