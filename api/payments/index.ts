// api/payments/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { Payment } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        if (req.method === 'GET') {
            // Allow admin to get all payments
            // Allow players to get their own payments (filter by user_id -> player_id)
            // Allow coaches to get payments for their players (requires JOINs)
            // For simplicity, return all payments for admin, and filter by player_id for players.
            // Coaches would need a more complex query.
            let sql = 'SELECT id, player_id, date, amount, description, created_at, updated_at FROM payments';
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

            } else if (req.user.role !== 'admin') {
                 // Coaches and others cannot view all payments
                 sendApiResponse(res, false, undefined, 'Access Denied', 403);
                 return;
            }

             // Allow filtering by player_id if provided (for admin)
             if (req.user.role === 'admin') {
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
            sendApiResponse(res, true, result.rows as Payment[], undefined, 200);

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


            const result = await client.query(
                'INSERT INTO payments (player_id, date, amount, description) VALUES ($1, $2, $3, $4) RETURNING id', // Use $n placeholders and RETURNING
                [playerId, date, amount, description]
            );
            const newPaymentId = result.rows[0].id; // Get the inserted ID

             // Fetch the newly created payment to return its ID (optional, can just return the ID)
             // const newPaymentResult = await client.query('SELECT id FROM payments WHERE id = $1', [newPaymentId]);
             // const newPayment = newPaymentResult.rows[0];


            sendApiResponse(res, true, { id: newPaymentId }, undefined, 201); // 201 Created

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
}, ['admin', 'player']); // Allow admin to GET/POST, player to GET their own

