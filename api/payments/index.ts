// api/payments/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { Payment } from '@/types/database.types'; // Import Payment type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    let connection;
    try {
        connection = await getConnection();

        if (req.method === 'GET') {
            // Allow admin to get all payments
            // Allow players to get their own payments (filter by user_id -> player_id)
            // Allow coaches to get payments for their players (requires JOINs)
            // For simplicity, return all payments for admin, and filter by player_id for players.
            // Coaches would need a more complex query.
            let sql = 'SELECT id, player_id, date, amount, description, created_at, updated_at FROM payments';
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

            } else if (req.user.role !== 'admin') {
                 // Coaches and others cannot view all payments
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
            }

            const [rows] = await connection.execute(sql, values);
            sendApiResponse(res, true, rows as Payment[], undefined, 200);

        } else if (req.method === 'POST') {
            // Only allow admin to add new payments
            if (req.user.role !== 'admin') {
                sendApiResponse(res, false, undefined, 'Access Denied: Admins only', 403);
                return;
            }

            const { playerId, date, amount, description } = req.body;

            if (!playerId || !date || amount === undefined || !description) {
                sendApiResponse(res, false, undefined, 'Player ID, date, amount, and description are required for payment', 400);
                return;
            }

             // Optional: Validate playerId exists
             // Skipping validation for demo simplicity


            const [result] = await connection.execute(
                'INSERT INTO payments (player_id, date, amount, description) VALUES (?, ?, ?, ?)',
                [playerId, date, amount, description]
            );
            const newPaymentId = (result as any).insertId;

             // Fetch the newly created payment to return its ID
             const [newPaymentRows] = await connection.execute('SELECT id FROM payments WHERE id = ?', [newPaymentId]);
             const newPayment = (newPaymentRows as any)[0];


            sendApiResponse(res, true, { id: newPayment.id }, undefined, 201); // 201 Created

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Payments endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process payments request', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'player']); // Allow admin to GET/POST, player to GET their own
