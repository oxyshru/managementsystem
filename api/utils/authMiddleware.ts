// api/utils/authMiddleware.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { sendApiResponse } from './apiResponse';
import { User } from '@/types/database.types'; // Import User type

// --- Simplified Mock Authentication ---
// In a real app, you would use JWT (jsonwebtoken library)
// and verify the token against a secret key.
// You would also likely fetch the user details from the DB
// based on the token's payload (e.g., user ID).

interface AuthenticatedRequest extends VercelRequest {
  user?: Omit<User, 'password'>; // Add user property to the request object
}

// Mock user data for validation (replace with actual token verification)
// In a real app, you would fetch user details from the database here
const mockUsers: Omit<User, 'password'>[] = [
    { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin', createdAt: new Date(), updatedAt: new Date(), status: 'active' },
    { id: 2, username: 'coach1', email: 'coach@example.com', role: 'coach', createdAt: new Date(), updatedAt: new Date(), status: 'active' },
    { id: 3, username: 'player1', email: 'player@example.com', role: 'player', createdAt: new Date(), updatedAt: new Date(), status: 'active' },
    { id: 4, username: 'player2', email: 'player2@example.com', role: 'player', createdAt: new Date(), updatedAt: new Date(), status: 'active' },
    { id: 5, username: 'player3', email: 'player3@example.com', role: 'player', createdAt: new Date(), updatedAt: new Date(), status: 'active' },
    { id: 6, username: 'coach2', email: 'coach2@example.com', role: 'coach', createdAt: new Date(), updatedAt: new Date(), status: 'active' },
];

// Mock token generation (replace with JWT)
function generateMockToken(user: Omit<User, 'password'>): string {
    // A simple base64 encoding of user id and role for demo
    return Buffer.from(`${user.id}:${user.role}`).toString('base64');
}

// Mock token verification (replace with JWT verification)
function verifyMockToken(token: string): Omit<User, 'password'> | null {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const [userId, userRole] = decoded.split(':');
        const id = parseInt(userId, 10);

        // Find the mock user (in a real app, fetch from DB based on ID)
        const user = mockUsers.find(u => u.id === id && u.role === userRole);

        return user || null;

    } catch (error) {
        console.error("Mock token verification failed:", error);
        return null;
    }
}
// --- End Simplified Mock Authentication ---


/**
 * Middleware to check for authentication.
 * Attaches user info to req.user if authenticated.
 * @param handler The API endpoint handler function
 * @param requiredRoles Optional array of roles required to access this endpoint
 */
export function authMiddleware(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>, requiredRoles?: User['role'][]) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Handle OPTIONS preflight requests before authentication
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*'); // Use env var for origin
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(200).end();
        return;
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      sendApiResponse(res, false, undefined, 'Authentication required', 401);
      return;
    }

    // Verify the token (using mock or JWT)
    const user = verifyMockToken(token); // Or jwt.verify(token, process.env.JWT_SECRET)

    if (!user) {
      sendApiResponse(res, false, undefined, 'Invalid token', 401);
      return;
    }

    // Check if user status is active (optional, but good practice)
    if (user.status !== 'active') {
         sendApiResponse(res, false, undefined, 'Account is not active', 403);
         return;
    }


    // Check for required roles
    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      sendApiResponse(res, false, undefined, 'Access denied', 403);
      return;
    }

    // Attach user info to the request for the handler
    (req as AuthenticatedRequest).user = user;

    // Proceed to the actual endpoint handler
    await handler(req as AuthenticatedRequest, res);
  };
}

// Export mock token functions for the auth endpoints
export { generateMockToken, verifyMockToken };
