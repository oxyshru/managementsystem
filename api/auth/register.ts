// api/auth/register.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db';
import { sendApiResponse } from '../utils/apiResponse';
import { generateMockToken } from '../utils/authMiddleware';
import { User, Player, Coach, Game } from '@/types/database.types';
import { PoolClient } from 'pg'; // Import PoolClient type

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


    let client: PoolClient | undefined; // Use PoolClient type
    try {
        client = await getConnection();

        // Check if user already exists
        const existingUsersResult = await client.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existingUsersResult.rows.length > 0) {
            sendApiResponse(res, false, undefined, 'User with this email or username already exists', 409);
            return;
        }

        // Start a transaction
        await client.query('BEGIN');

        // 1. Create User
        // In a real app, hash the password here
        const userResult = await client.query(
            'INSERT INTO users (username, email, password, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, status, created_at, updated_at', // Use $n placeholders and RETURNING
            [username, email, password, role, 'active'] // Default status to active on registration
        );
        const newUser = userResult.rows[0];
        const newUserId = newUser.id;

        let newProfileId = null;

        // 2. Create Player or Coach Profile
        if (role === 'player') {
             // Create Player profile
            const playerResult = await client.query(
                'INSERT INTO players (user_id, first_name, last_name) VALUES ($1, $2, $3) RETURNING id', // Use $n placeholders and RETURNING
                [newUserId, firstName, lastName]
            );
             newProfileId = playerResult.rows[0].id;

             // Link the player to selected games in the player_games table
             if (Array.isArray(sports) && sports.length > 0) {
                 // Fetch game IDs based on names
                 const gameNames = sports;
                 const gameIdsResult = await client.query('SELECT id FROM games WHERE name = ANY($1)', [gameNames]);
                 const gameIds = gameIdsResult.rows.map(row => row.id);

                 // Insert into player_games table
                 if (gameIds.length > 0) {
                     const playerGamesValues = gameIds.map(gameId => `(${newProfileId}, ${gameId})`).join(',');
                     await client.query(`INSERT INTO player_games (player_id, game_id) VALUES ${playerGamesValues}`);
                 }
             }


        } else if (role === 'coach') {
            const coachResult = await client.query(
                 // Simplified Coach creation - specialization and experience are optional in this demo INSERT
                'INSERT INTO coaches (user_id, first_name, last_name, specialization, experience) VALUES ($1, $2, $3, $4, $5) RETURNING id', // Use $n placeholders and RETURNING
                [newUserId, firstName, lastName, specialization || null, experience || null]
            );
             newProfileId = coachResult.rows[0].id;
        }
        // Admin profiles are typically created manually in the database or via a separate admin tool,
        // not via this public registration endpoint.

        // Commit the transaction
        await client.query('COMMIT');

        // Generate a mock token for the new user
         const token = generateMockToken(newUser);

        // Return the new user data and token (excluding password)
        const newUserResponseData = {
             id: newUser.id,
             username: newUser.username,
             email: newUser.email,
             role: newUser.role,
             status: newUser.status,
             createdAt: newUser.created_at,
             updatedAt: newUser.updated_at,
             token: token, // Include the token
        };


        sendApiResponse(res, true, newUserResponseData, undefined, 201); // 201 Created

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK'); // Rollback transaction on error
        }
        console.error('Registration error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Registration failed', 500);
    } finally {
        if (client) {
            client.release();
        }
    }
}

