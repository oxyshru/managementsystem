// src/lib/db.service.ts
// This service will now make HTTP requests to your backend API

import { ApiResponse, User, Player, Coach, PlayerStats, TrainingSession, Attendance, Batch, Payment, Game } from '@/types/database.types';

// Use a base path for API calls, typically '/api' when deployed on Vercel
const API_BASE_PATH = import.meta.env.VITE_API_BASE_PATH || '/api';


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

    // Construct the full URL using the base path and endpoint
    // Ensure the endpoint starts with a '/' if API_BASE_PATH is defined
    const fullUrl = `${API_BASE_PATH}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;


    const response = await fetch(fullUrl, { // Use fullUrl here
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    // Check if the response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
         const responseData = await response.json();

         if (!response.ok) {
           // Handle API errors (e.g., 400, 401, 404, 500 status codes)
           return {
             success: false,
             error: responseData.message || `API Error: ${response.statusText}`,
           };
         }

         // Assuming your backend API response structure is { success: boolean, data?: T, error?: string }
         // The backend CJS files now return the data directly in the response body, not nested under 'data'
         // Adjust this based on the *actual* response structure from your backend CJS files.
         // Based on your CJS code, the response body *is* the data/error object.
         return responseData;


    } else {
         // Handle non-JSON responses (e.g., plain text errors, HTML)
         const text = await response.text();
         if (!response.ok) {
             return {
                success: false,
                error: `API Error: ${response.status} ${response.statusText} - ${text || 'No response body'}`,
             };
         }
         // If it's not JSON but successful, maybe it's an empty response or unexpected format
         console.warn(`Received non-JSON response from ${endpoint}:`, text);
         return {
             data: text as any, // Return text as data, type might be incorrect
             success: true,
         };
    }


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
          // Calls the backend's /api/status endpoint
          // Explicitly call the /status endpoint relative to the API base path
          return callApi<{ connected: boolean }>('/auth/status');
  }

  // The resetDatabase function would also need to call a backend endpoint
  async resetDatabase(): Promise<ApiResponse<void>> {
       // Replace with a call to your backend's reset endpoint (use with caution!)
       try {
           // Explicitly call the /admin/reset-db endpoint relative to the API base path
           const response = await fetch(`${API_BASE_PATH}/admin/reset-db`, { // Use API_BASE_PATH here
               method: 'POST',
                headers: { // Include auth header for admin endpoint
                   'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
           }); // Example endpoint
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

