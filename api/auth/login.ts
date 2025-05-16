// api/auth/login.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../utils/db'; // Corrected import path
import { sendApiResponse } from '../utils/apiResponse'; // Corrected import path
import { generateMockToken } from '../utils/authMiddleware'; // Corrected import path

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

    const { email, password } = req.body;

    if (!email || !password) {
        sendApiResponse(res, false, undefined, 'Email and password are required', 400);
        return;
    }

    let connection;
    try {
        connection = await getConnection();

        // In a real app, you would hash the password and compare
        // For this demo, we'll do a plain text password check (INSECURE!)
        const [rows] = await connection.execute('SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE email = ? AND password = ?', [email, password]);

        const user = (rows as any)[0];

        if (!user) {
            sendApiResponse(res, false, undefined, 'Invalid email or password', 401);
            return;
        }

        // Check user status
        if (user.status !== 'active') {
             sendApiResponse(res, false, undefined, 'Account is not active', 403);
             return;
        }


        // Generate a mock token (replace with JWT)
        const token = generateMockToken(user);

        // Return user data (excluding password) and the token
        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            token: token, // Include the token in the response
        };


        sendApiResponse(res, true, userData, undefined, 200);

    } catch (error) {
        console.error('Login error:', error);
        sendApiResponse(res, false, undefined, error instanceof Error ? error.message : 'Login failed', 500);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
