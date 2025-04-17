import express from 'express';
import pool from '../database/database.js';

const router = express.Router();

// Get all restaurants
router.get('/', async (req, res) => {
  try {

    const result = await pool.query('SELECT * FROM restaurant');
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});



export default router;
