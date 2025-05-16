// api/auth/register.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { generateMockToken } from '../utils/authMiddleware'; // Corrected import path
import { User, Player, Coach, Game } from '@/types/database.types'; // Import types

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        sendApiResponse(res, false, undefined, 'Method Not Allowed', 405);
        return;
    }

    // Expected data from frontend registration form (manual or public)
    const { username, email, password, role, firstName, lastName, sports, specialization, experience } = req.body;

    if (!email || !password || !role || !firstName || !lastName) {
        sendApiResponse(res, false, undefined, 'Required user and profile fields are missing', 400);
        return;
    }

    // Basic role validation
    if (!['player', 'coach', 'admin'].includes(role)) {
        sendApiResponse(res, false, undefined, 'Invalid role specified', 400);
        return;
    }

    // Specific validation based on role
    if (role === 'player') {
         // Frontend sends sports as string[], backend needs to handle linking to games table
         // Let's enforce sports selection for players as per frontend validation.
         if (!Array.isArray(sports) || sports.length === 0) {
              sendApiResponse(res, false, undefined, 'Player registration requires selecting at least one sport.', 400);
              return;
         }
    }
    // Coach specialization/experience are optional in this demo INSERT


    let connection;
    try {
        connection = await getConnection();

        // Check if user already exists
        const [existingUsers] = await connection.execute('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
        if ((existingUsers as any).length > 0) {
            sendApiResponse(res, false, undefined, 'User with this email or username already exists', 409);
            return;
        }

        // Start a transaction
        await connection.beginTransaction();

        // 1. Create User
        // In a real app, hash the password here
        const [userResult] = await connection.execute(
            'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
            [username, email, password, role, 'active'] // Default status to active on registration
        );
        const newUserId = (userResult as any).insertId;

        let newProfileId = null;

        // 2. Create Player or Coach Profile
        if (role === 'player') {
             // Simplified Player creation - does NOT handle player_games linking here
            const [playerResult] = await connection.execute(
                'INSERT INTO players (user_id, first_name, last_name) VALUES (?, ?, ?)',
                [newUserId, firstName, lastName]
            );
             newProfileId = (playerResult as any).insertId;

             // In a real app, you would now link the player to selected games in the player_games table
             // based on the 'sports' array received in the payload.
             // This requires fetching game IDs based on names and inserting into player_games.
             // Skipping full implementation for demo simplicity.
             console.warn("Linking player to sports is simplified in this demo backend.");


        } else if (role === 'coach') {
            const [coachResult] = await connection.execute(
                 // Simplified Coach creation - specialization and experience are optional in this demo INSERT
                'INSERT INTO coaches (user_id, first_name, last_name, specialization, experience) VALUES (?, ?, ?, ?, ?)',
                [newUserId, firstName, lastName, specialization || null, experience || null]
            );
             newProfileId = (coachResult as any).insertId;
        }
        // Admin profiles are typically created manually in the database or via a separate admin tool,
        // not via this public registration endpoint.

        // Commit the transaction
        await connection.commit();

        // Fetch the newly created user to return (excluding password)
        const [newUserRows] = await connection.execute('SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE id = ?', [newUserId]);
        const newUser = (newUserRows as any)[0];

         // Generate a mock token for the new user
         const token = generateMockToken(newUser);

        // Return the new user data and token
        const newUserResponseData = {
             ...newUser,
             token: token, // Include the token
        };


        sendApiResponse(res, true, newUserResponseData, undefined, 201); // 201 Created

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback transaction on error
        }
        console.error('Registration error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Registration failed', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
