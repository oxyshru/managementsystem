// api/utils/db.ts
import { Pool, PoolClient } from 'pg'; // Use pg library

// Database connection details from environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432', 10), // Default PostgreSQL port is 5432
  max: 10, // Adjust as needed (connectionLimit in mysql2)
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create a connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    // Basic validation for required variables
    if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
        console.error("Missing required database environment variables.");
        // In a production app, you might throw a more specific error or exit
        throw new Error("Database configuration is incomplete.");
    }
    pool = new Pool(dbConfig);
    console.log("PostgreSQL database pool created.");

    // Optional: Add error handling for the pool
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1); // Exit the process if a client in the pool has an error
    });
  }
  return pool;
}

/**
 * Get a database connection from the pool.
 * Remember to release the connection using `client.release()`.
 */
export async function getConnection(): Promise<PoolClient> {
  try {
    const client = await getPool().connect();
    // console.log("Database connection obtained.");
    return client;
  } catch (error) {
    console.error("Error getting database connection:", error);
    throw error; // Re-throw to be caught by the API endpoint handler
  }
}

