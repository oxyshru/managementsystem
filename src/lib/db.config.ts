    // src/lib/db.config.ts
    // Database configuration (Used by frontend services to tell backend where to connect, **insecure**)
    // NOTE: In this frontend-only simulation, these values are not actually used for a real connection,
    // but they are kept to match the original structure and demonstrate where config would go.
    export const dbConfig = {
        host: import.meta.env.VITE_DB_HOST || 'localhost',
        user: import.meta.env.VITE_DB_USER || 'root',
        password: import.meta.env.VITE_DB_PASSWORD || '', // Sending password from frontend is insecure!
        database: import.meta.env.VITE_DB_NAME || 'my_database',
        port: Number(import.meta.env.VITE_DB_PORT) || 3306
      };
  