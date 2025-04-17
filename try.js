import pool from './src/database/database.js';

const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');  // Should return the current timestamp
    console.log('Connected to PostgreSQL:', res.rows);
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
};

testConnection();
