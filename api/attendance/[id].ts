// api/attendance/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { Attendance } from '@/types/database.types'; // Import Attendance type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const attendanceId = parseInt(req.query.id as string, 10);

    if (isNaN(attendanceId)) {
        sendApiResponse(res, false, undefined, 'Invalid attendance ID', 400);
        return;
    }

    let connection;
    try {
        connection = await getConnection();

        // Fetch attendance record by its ID
        const [rows] = await connection.execute('SELECT id, session_id, player_id, status, comments, created_at, updated_at FROM session_attendance WHERE id = ?', [attendanceId]);
        const attendance = (rows as any)[0];

        if (!attendance) {
            sendApiResponse(res, false, undefined, 'Attendance record not found', 404);
            return;
        }

        // Check if the authenticated user is an admin, the coach of the associated session's batch, or the player themselves
        const [sessionBatchCoachRows] = await connection.execute('SELECT b.coach_id, p.user_id AS player_user_id FROM session_attendance sa JOIN training_sessions ts ON sa.session_id = ts.id JOIN batches b ON ts.batch_id = b.id JOIN players p ON sa.player_id = p.id WHERE sa.id = ?', [attendanceId]);
        const relatedInfo = (sessionBatchCoachRows as any)[0];

        if (!relatedInfo) {
             // Should not happen if FKs are correct, but handle defensively
             sendApiResponse(res, false, undefined, 'Related session, batch, or player not found', 404);
             return;
        }

        const isRelatedCoach = relatedInfo.coach_id !== null && req.user.role === 'coach' && req.user.id === (await connection.execute('SELECT user_id FROM coaches WHERE id = ?', [relatedInfo.coach_id]) as any)[0]?.user_id;
        const isRelatedPlayer = req.user.role === 'player' && req.user.id === relatedInfo.player_user_id;


        if (req.user.role !== 'admin' && !isRelatedCoach && !isRelatedPlayer) {
             sendApiResponse(res, false, undefined, 'Access Denied', 403);
             return;
        }


        if (req.method === 'GET') {
             sendApiResponse(res, true, attendance as Attendance, undefined, 200);

        } else if (req.method === 'PUT') {
            // Allow admin or the coach of the associated session's batch to update attendance
            // Players typically cannot update attendance
            if (req.user.role !== 'admin' && !isRelatedCoach) {
                sendApiResponse(res, false, undefined, 'Access Denied', 403);
                return;
            }

            const { status, comments } = req.body; // Only allow updating status and comments
            const updateFields: string[] = [];
            const updateValues: any[] = [];

            if (status !== undefined) {
                 if (!['present', 'absent', 'excused'].includes(status)) {
                      sendApiResponse(res, false, undefined, 'Invalid status specified', 400);
                      return;
                 }
                 updateFields.push('status = ?'); updateValues.push(status);
            }
            if (comments !== undefined) { updateFields.push('comments = ?'); updateValues.push(comments); }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(attendanceId); // Add attendance ID for the WHERE clause

            const sql = `UPDATE session_attendance SET ${updateFields.join(', ')} WHERE id = ?`;
            const [result] = await connection.execute(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);


        } else if (req.method === 'DELETE') {
            // Allow admin or the coach of the associated session's batch to delete attendance
            if (req.user.role !== 'admin' && !isRelatedCoach) {
                sendApiResponse(res, false, undefined, 'Access Denied', 403);
                return;
            }

            const [result] = await connection.execute('DELETE FROM session_attendance WHERE id = ?', [attendanceId]);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Attendance endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process attendance request', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach (all methods if related), player (GET if related)
