// src/lib/db.service.ts
// This service will now make HTTP requests to your backend API

import { ApiResponse, User, Player, Coach, PlayerStats, TrainingSession, Attendance, Batch, Payment, Game } from '@/types/database.types';

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    console.error("VITE_API_URL is not defined in the environment variables.");
    // You might want to throw an error or handle this case appropriately
}


/**
 * Generic function to make API calls
 * @param endpoint The API endpoint (e.g., '/users', '/players/1')
 * @param method HTTP method (GET, POST, PUT, DELETE)
 * @param data Request body data for POST/PUT
 * @returns Promise with ApiResponse
 */
async function callApi<T>(
  endpoint: string,
  method: string = 'GET',
  data?: any
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      // Include authorization header if the user is logged in
      // You would get the token from localStorage or a state management solution
      ...(localStorage.getItem('authToken') && {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Handle API errors (e.g., 400, 401, 404, 500 status codes)
      return {
        success: false,
        error: responseData.message || `API Error: ${response.statusText}`,
      };
    }

    return {
      data: responseData,
      success: true,
    };

  } catch (error) {
    console.error(`API call failed for ${method} ${endpoint}:`, error);
    return {
      error: error instanceof Error ? error.message : 'Network or unexpected error',
      success: false,
    };
  }
}


/**
 * Database service to handle API interactions with the backend
 */
class DbService {
  /**
   * Get a single record from an endpoint by ID
   * @param endpointBase The base endpoint (e.g., '/users')
   * @param id Record ID
   * @returns Promise with the record or error
   */
  async getById<T>(endpointBase: string, id: number): Promise<ApiResponse<T>> {
    return callApi<T>(`${endpointBase}/${id}`);
  }

  /**
   * Get multiple records from an endpoint
   * @param endpointBase The base endpoint (e.g., '/users')
   * @param params Optional query parameters (e.g., { userId: 1, limit: 10 })
   * @returns Promise with records or error
   */
  async getMany<T>(
    endpointBase: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T[]>> {
    const queryParams = params ? new URLSearchParams(params).toString() : '';
    return callApi<T[]>(`${endpointBase}${queryParams ? `?${queryParams}` : ''}`);
  }

  /**
   * Insert a new record via an endpoint
   * @param endpointBase The base endpoint (e.g., '/users')
   * @param data Record data
   * @returns Promise with the inserted record ID or error
   */
  async insert<T>(endpointBase: string, data: any): Promise<ApiResponse<{ id: number; }>> {
     // The backend should handle adding id, createdAt, updatedAt
    return callApi<{ id: number }>(endpointBase, 'POST', data);
  }

  /**
   * Update an existing record via an endpoint
   * @param endpointBase The base endpoint (e.g., '/users')
   * @param id Record ID
   * @param data Record data to update
   * @returns Promise with success status or error
   */
  async update<T>(endpointBase: string, id: number, data: Partial<T>): Promise<ApiResponse<{ affectedRows: number; }>> {
    return callApi<{ affectedRows: number }>(`${endpointBase}/${id}`, 'PUT', data);
  }

  /**
   * Delete a record via an endpoint
   * @param endpointBase The base endpoint (e.g., '/users')
   * @param id Record ID
   * @returns Promise with success status or error
   */
  async delete(endpointBase: string, id: number): Promise<ApiResponse<{ affectedRows: number; }>> {
    return callApi<{ affectedRows: number }>(`${endpointBase}/${id}`, 'DELETE');
  }

  /**
   * Test the backend API connection (simulated)
   * This would typically call a simple health check or status endpoint on your backend.
   * @returns Promise with connection status
   */
  async testConnection(): Promise<ApiResponse<{ connected: boolean; }>> {
      // Replace with a call to your backend's health check endpoint
      try {
          const response = await fetch(`${API_URL}/status`); // Example endpoint
          if (response.ok) {
              return { data: { connected: true }, success: true };
          } else {
               const errorData = await response.json().catch(() => ({})); // Try to parse error body
               return {
                   data: { connected: false },
                   success: false,
                   error: errorData.message || `Backend status check failed: ${response.statusText}`
               };
          }
      } catch (error) {
           console.error('Backend connection test failed:', error);
           return {
               data: { connected: false },
               success: false,
               error: error instanceof Error ? error.message : 'Network error during backend connection test'
           };
      }
  }

  // The resetDatabase function would also need to call a backend endpoint
  async resetDatabase(): Promise<ApiResponse<void>> {
       // Replace with a call to your backend's reset endpoint (use with caution!)
       try {
           const response = await fetch(`${API_URL}/admin/reset-db`, { method: 'POST' }); // Example endpoint
           if (response.ok) {
               console.log("Backend database reset initiated.");
               return { success: true };
           } else {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.message || `Backend database reset failed: ${response.statusText}`
                };
           }
       } catch (error) {
           console.error('Backend database reset failed:', error);
           return {
               success: false,
               error: error instanceof Error ? error.message : 'Network error during backend database reset'
           };
       }
   }
}

// Export a singleton instance
const dbService = new DbService();
export default dbService;
