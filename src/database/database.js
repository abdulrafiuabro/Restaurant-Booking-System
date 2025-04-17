import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

// PostgreSQL connection pool setup using the environment variables
const pool = new Pool({
  user: process.env.DB_USER,          // 'postgres' from .env
  host: process.env.DB_HOST,          // 'localhost' from .env
  database: process.env.DB_NAME,      // 'rezq' from .env
  password: process.env.DB_PASSWORD,  // 'fast123' from .env
  port: process.env.DB_PORT,          // 5432 from .env
});

export default pool;
