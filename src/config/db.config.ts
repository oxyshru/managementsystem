export const dbConfig = {
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  user: import.meta.env.VITE_DB_USER || 'root',
  password: import.meta.env.VITE_DB_PASSWORD || '', // Sending password from frontend is insecure!
  database: import.meta.env.VITE_DB_NAME || 'my_database',
  port: Number(import.meta.env.VITE_DB_PORT) || 3306
};