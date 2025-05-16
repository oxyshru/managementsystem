// src/services/auth.service.ts
// This service will now use the new dbService to interact with the backend API

import dbService from '@/lib/db.service';
import { User, ApiResponse, Player, Coach } from '@/types/database.types';

class AuthService {
  /**
   * Login a user by calling the backend API
   * @param email User email
   * @param password User password
   * @returns Promise with user data or error
   */
  async login(email: string, password: string): Promise<ApiResponse<Omit<User, 'password'>>> {
    try {
      // Call your backend login endpoint
      const result = await dbService.insert<Omit<User, 'password'>>('/auth/login', { email, password }); // Assuming a POST to /auth/login

      if (result.success && result.data) {
        // Assuming the backend returns user data and a token on successful login
        // You would need to store the actual token returned by the backend
        localStorage.setItem('authToken', (result.data as any).token || 'mock-token'); // Store the token from backend
        localStorage.setItem('userRole', result.data.role);
        localStorage.setItem('userId', result.data.id.toString());

        return {
          data: result.data,
          success: true
        };
      } else {
        return {
          error: result.error || 'Login failed',
          success: false
        };
      }
    } catch (error) {
      console.error('Login API call error:', error);
      return {
        error: error instanceof Error ? error.message : 'Login failed',
        success: false
      };
    }
  }

  /**
   * Register a new user by calling the backend API
   * @param userData User registration data
   * @returns Promise with user data or error
   */
  async register(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { firstName?: string; lastName?: string; sports?: string[] }): Promise<ApiResponse<Omit<User, 'password'>>> {
    try {
      // Call your backend registration endpoint
      // The backend should handle creating the user and the associated profile (player/coach)
      const result = await dbService.insert<Omit<User, 'password'>>('/auth/register', userData); // Assuming a POST to /auth/register

      if (result.success && result.data) {
           // Assuming the backend returns the newly created user data and maybe a token
           // You might need to log the user in automatically after registration
           localStorage.setItem('authToken', (result.data as any).token || 'mock-token-after-reg'); // Store token if backend returns one
           localStorage.setItem('userRole', result.data.role);
           localStorage.setItem('userId', result.data.id.toString());

           return {
               data: result.data,
               success: true
           };
      } else {
        return {
          error: result.error || 'Registration failed',
          success: false
        };
      }
    } catch (error) {
      console.error('Registration API call error:', error);
      return {
        error: error instanceof Error ? error.message : 'Registration failed',
        success: false
      };
    }
  }

  /**
   * Logout the current user (client-side only, backend might have a logout endpoint too)
   */
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    // Optionally call a backend logout endpoint here if needed
    // callApi('/auth/logout', 'POST');
  }

  /**
   * Check if a user is currently logged in based on client-side token
   * @returns Boolean indicating if user is logged in
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  /**
   * Get the current authenticated user by calling the backend API
   * @returns Promise with user data or error
   */
  async getCurrentUser(): Promise<ApiResponse<Omit<User, 'password'>>> {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
          return { error: 'User ID not found in localStorage', success: false };
      }
      // Call your backend endpoint to get the current user's data
      // This endpoint should use the auth token to identify the user
      const result = await dbService.getById<Omit<User, 'password'>>('/users', parseInt(userId, 10)); // Assuming a GET to /users/:id

      if (result.success && result.data) {
        return {
          data: result.data,
          success: true
        };
      } else {
          // If fetching current user data fails, it might mean the token is invalid
          this.logout(); // Log out the user
          return {
             error: result.error || 'Failed to get current user data. Please log in again.',
             success: false
          };
      }
    } catch (error) {
      console.error('Get current user API call error:', error);
       this.logout(); // Log out on error
      return {
        error: error instanceof Error ? error.message : 'Failed to get current user data',
        success: false
      };
    }
  }
}

// Export a singleton instance
const authService = new AuthService();
export default authService;
