// api/payments/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { Payment } from '@/types/database.types'; // Import Payment type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const paymentId = parseInt(req.query.id as string, 10);

    if (isNaN(paymentId)) {
        sendApiResponse(res, false, undefined, 'Invalid payment ID', 400);
        return;
    }

    let connection;
    try {
        connection = await getConnection();

        // Fetch payment details
        const [rows] = await connection.execute('SELECT id, player_id, date, amount, description, created_at, updated_at FROM payments WHERE id = ?', [paymentId]);
        const payment = (rows as any)[0];

        if (!payment) {
            sendApiResponse(res, false, undefined, 'Payment not found', 404);
            return;
        }

        // Allow admin to get/update/delete any payment
        // Allow the player whose payment it is (by checking player_id -> user_id) to get their payment
        if (req.user.role !== 'admin') {
             // Find the player ID for the current user
             const [playerRows] = await connection.execute('SELECT id FROM players WHERE user_id = ?', [req.user.id]);
             const player = (playerRows as any)[0];

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

            if (playerId !== undefined) { updateFields.push('player_id = ?'); updateValues.push(playerId); }
            if (date !== undefined) { updateFields.push('date = ?'); updateValues.push(date); }
            if (amount !== undefined) { updateFields.push('amount = ?'); updateValues.push(amount); }
            if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(paymentId); // Add payment ID for the WHERE clause

            const sql = `UPDATE payments SET ${updateFields.join(', ')} WHERE id = ?`;
            const [result] = await connection.execute(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);


        } else if (req.method === 'DELETE') {
            // Only allow admin to delete payments
            if (req.user.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const [result] = await connection.execute('DELETE FROM payments WHERE id = ?', [paymentId]);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Payment endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process payment request', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'player']); // Allow admin (all methods), player (GET their own)
