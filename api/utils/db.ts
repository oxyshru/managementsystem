// api/utils/db.ts
// Use require for pg to avoid potential ESM/CJS interop issues on Vercel
import type { PoolClient } from 'pg'; // Import types only
const { Pool } = require('pg'); // Use require for the Pool implementation

// Database connection details from environment variables
// Use DATABASE_URL if available (preferred for Render), otherwise fall back to individual variables
const connectionString = process.env.DATABASE_URL;

const dbConfig = connectionString ?
  {
    connectionString,
    // No need for manual SSL config if sslmode=require is in the URL
    // ssl: { rejectUnauthorized: false }, // Remove or comment out if using connection string with sslmode=require
  } :
  {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    // Add SSL config if not using connection string and connecting to cloud DB
    ssl: {
      rejectUnauthorized: false, // Keep this if not using connection string and need SSL
    },
  };


// Create a connection pool
// Use 'any' for the pool type for simplicity with require
let pool: any | null = null;

// Use the imported Pool type here
function getPool(): any { // Adjust return type
  if (!pool) {
    // Basic validation
    if (!dbConfig.connectionString && (!dbConfig.host || !dbConfig.user || !dbConfig.database)) {
        console.error("Missing required database environment variables (DATABASE_URL or individual params).");
        throw new Error("Database configuration is incomplete.");
    }
    // Instantiate the Pool class using the imported variable
    pool = new Pool(dbConfig); // Pool is now the result of require
    console.log("PostgreSQL database pool created.");

    // Optional: Add error handling for the pool
    pool.on('error', (err: Error, client: PoolClient) => { // Use imported PoolClient type
        console.error('Unexpected error on idle client', err);
        // process.exit(-1); // Exiting might be too aggressive in a serverless function
    });
  }
  return pool;
}

/**
 * Get a database connection from the pool.
 * Remember to release the connection using `client.release()`.
 */
// Use the imported PoolClient type here
export async function getConnection(): Promise<PoolClient> {
  try {
    // Connect using the pool
    const client = await getPool().connect();
    // console.log("Database connection obtained.");
    return client;
  } catch (error) {
    console.error("Error getting database connection:", error);
    throw error; // Re-throw to be caught by the API endpoint handler
  }
}
