// api/performance_notes/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { authMiddleware } from '../utils/authMiddleware';
import { PerformanceNote } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

// Wrap the handler with authMiddleware
export default authMiddleware(async (req: any, res: VercelResponse) => { // Use 'any' for req to access req.user
    const noteId = parseInt(req.query.id as string, 10);

    if (isNaN(noteId)) {
        sendApiResponse(res, false, undefined, 'Invalid performance note ID', 400);
        return;
    }

    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        // Fetch performance note by its ID
        const result = await client.query('SELECT id, player_id, coach_id, date, note, created_at, updated_at FROM performance_notes WHERE id = $1', [noteId]);
        const note = result.rows[0];

        if (!note) {
            sendApiResponse(res, false, undefined, 'Performance note not found', 404);
            return;
        }

        // Check if the authenticated user is an admin, the coach who created the note, or the player the note is about
         // Fetch the user_id for the related coach if coach_id is not null
         let noteCreatorCoachUserId = null;
         if (note.coach_id !== null) {
             const coachUserResult = await client.query('SELECT user_id FROM coaches WHERE id = $1', [note.coach_id]);
             noteCreatorCoachUserId = coachUserResult.rows[0]?.user_id || null;
         }

         // Fetch the user_id for the player the note is about
         const noteSubjectPlayerUserResult = await client.query('SELECT user_id FROM players WHERE id = $1', [note.player_id]);
         const noteSubjectPlayerUserId = noteSubjectPlayerUserResult.rows[0]?.user_id || null;


        const isNoteCreatorCoach = note.coach_id !== null && req.user.role === 'coach' && req.user.id === noteCreatorCoachUserId;
        const isNoteSubjectPlayer = req.user.role === 'player' && req.user.id === noteSubjectPlayerUserId;


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
             let paramIndex = 1;

            if (date !== undefined) { updateFields.push(`date = $${paramIndex++}`); updateValues.push(date); }
            if (noteContent !== undefined) { updateFields.push(`note = $${paramIndex++}`); updateValues.push(noteContent); }


            if (updateFields.length === 0) {
                sendApiResponse(res, false, undefined, 'No valid fields provided for update', 400);
                return;
            }

            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(noteId); // Add note ID for the WHERE clause

            const sql = `UPDATE performance_notes SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
            const result = await client.query(sql, updateValues);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200); // Use rowCount for affected rows


        } else if (req.method === 'DELETE') {
            // Allow admin or the coach who created the note to delete it
            if (req.user.role !== 'admin' && !isNoteCreatorCoach) {
                sendApiResponse(res, false, undefined, 'Access Denied', 403);
                return;
            }

            const result = await client.query('DELETE FROM performance_notes WHERE id = $1', [noteId]);

            sendApiResponse(res, true, { affectedRows: result.rowCount }, undefined, 200); // Use rowCount for affected rows

        } else {
            sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        }

    } catch (error) {
        console.error('Performance note endpoint error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Failed to process performance note request', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}, ['admin', 'coach', 'player']); // Allow admin, coach (all methods if related), player (GET if related)

