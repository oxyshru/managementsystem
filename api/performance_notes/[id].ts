// api/performance_notes/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { authMiddleware } from '../utils/authMiddleware'; // Corrected import path
import { PerformanceNote } from '@/types/database.types'; // Assuming you add PerformanceNote to types

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const noteId = parseInt(req.query.id as string, 10);

    if (isNaN(noteId)) {
        sendApiResponse(res, false, undefined, 'Invalid performance note ID', 400);
        return;
    }

    let connection;
    try {
        connection = await getConnection();

        // Fetch performance note by its ID
        const [rows] = await connection.execute('SELECT id, player_id, coach_id, date, note, created_at, updated_at FROM performance_notes WHERE id = ?', [noteId]);
        const note = (rows as any)[0];

        if (!note) {
            sendApiResponse(res, false, undefined, 'Performance note not found', 404);
            return;
        }

        // Check if the authenticated user is an admin, the coach who created the note, or the player the note is about
        const isNoteCreatorCoach = note.coach_id !== null && req.user.role === 'coach' && req.user.id === (await connection.execute('SELECT user_id FROM coaches WHERE id = ?', [note.coach_id]) as any)[0]?.user_id;
        const isNoteSubjectPlayer = req.user.role === 'player' && req.user.id === (await connection.execute('SELECT user_id FROM players WHERE id = ?', [note.player_id]) as any)[0]?.user_id;


        if (req.user.role !== 'admin' && !isNoteCreatorCoach && !isNoteSubjectPlayer) {
             sendApiResponse(res, false, undefined, 'Access Denied', 403);
             return;
        }


        if (req.method === 'GET') {
             sendApiResponse(res, true, note as PerformanceNote, undefined, 200);

        } else if (req.method === 'PUT') {
            // Allow admin or the coach who created the note to update it
            // Players cannot update notes about themselves
            if (req.user.role !== 'admin' && !isNoteCreatorCoach) {
                sendApiResponse(res, false, undefined, 'Access Denied', 403);
                return;
            }

            const { date, note: noteContent } = req.body; // Allow updating date and note content
            const updateFields: string[] = [];
            const updateValues: any[] = [];

            if (date !== undefined) { updateFields.push('date = ?'); updateValues.push(date); }
            if (noteContent !== undefined) { updateFields.push('note = ?'); updateValues.push(noteContent); }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(noteId); // Add note ID for the WHERE clause

            const sql = `UPDATE performance_notes SET ${updateFields.join(', ')} WHERE id = ?`;
            const [result] = await connection.execute(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);


        } else if (req.method === 'DELETE') {
            // Allow admin or the coach who created the note to delete it
            if (req.user.role !== 'admin' && !isNoteCreatorCoach) {
                sendApiResponse(res, false, undefined, 'Access Denied', 403);
                return;
            }

            const [result] = await connection.execute('DELETE FROM performance_notes WHERE id = ?', [noteId]);

            sendApiResponse(res, true, { affectedRows: (result as any).affectedRows }, undefined, 200);

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Performance note endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process performance note request', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach (all methods if related), player (GET if related)
