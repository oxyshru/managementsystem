// api/utils/db.ts
import mysql from 'mysql2/promise';

// Database connection details from environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0
};

// Create a connection pool
let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    // Basic validation for required variables
    if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
        console.error("Missing required database environment variables.");
        // In a production app, you might throw a more specific error or exit
    }
    pool = mysql.createPool(dbConfig);
    console.log("Database pool created.");
  }
  return pool;
}

/**
 * Get a database connection from the pool.
 * Remember to release the connection using `connection.release()`.
 */
export async function getConnection(): Promise<mysql.PoolConnection> {
  try {
    const connection = await getPool().getConnection();
    // console.log("Database connection obtained.");
    return connection;
  } catch (error) {
    console.error("Error getting database connection:", error);
    throw error; // Re-throw to be caught by the API endpoint handler
  }
}
