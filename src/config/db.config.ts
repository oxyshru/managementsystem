    // src/config/db.config.ts
    // Database configuration (Used by frontend services to tell backend where to connect, **insecure**)
    // NOTE: This file is primarily for displaying configuration details on the frontend
    // and is NOT used for actual database connections from the frontend after the API migration.
    // The backend uses its own environment variables for database connection.
    export const dbConfig = {
      host: import.meta.env.VITE_DB_HOST || 'localhost',
      user: import.meta.env.VITE_DB_USER || 'root',
      // password: import.meta.env.VITE_DB_PASSWORD || '', // REMOVED: Do not expose database password on the frontend
      database: import.meta.env.VITE_DB_NAME || 'my_database',
      port: Number(import.meta.env.VITE_DB_PORT) || 5432
    };
