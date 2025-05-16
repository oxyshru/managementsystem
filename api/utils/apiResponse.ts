// api/utils/apiResponse.ts
import { VercelResponse } from '@vercel/node';

// Define the ApiResponse type expected by the frontend
interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Helper function to send API responses in the ApiResponse format.
 * @param res VercelResponse object
 * @param success Boolean indicating success
 * @param data Optional data payload
 * @param error Optional error message
 * @param statusCode HTTP status code
 */
export function sendApiResponse<T>(
  res: VercelResponse,
  success: boolean,
  data?: T,
  error?: string,
  statusCode: number = success ? 200 : 500
): void {
  const responseBody: ApiResponse<T> = {
    success,
    data,
    error,
  };
  res.status(statusCode).json(responseBody);
}
