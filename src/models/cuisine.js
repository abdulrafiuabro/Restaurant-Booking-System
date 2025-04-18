import pool from '../database/database.js';  // Import the pool for DB queries

// Function to check if cuisines already exist
export const getExistingCuisines = async (cuisineNames) => {
  const query = 'SELECT name FROM cuisines WHERE name = ANY($1)';
  const result = await pool.query(query, [cuisineNames]);
  return result.rows.map(row => row.name); // Return an array of existing cuisine names
};

// Function to create new cuisines
export const createCuisines = async (newCuisines) => {
  const query = 'INSERT INTO cuisines (name) VALUES ($1) RETURNING *';
  const insertPromises = newCuisines.map(cuisine => pool.query(query, [cuisine]));
  await Promise.all(insertPromises);  // Insert all new cuisines
};

// Function to fetch all cuisines from the database
export const getAllCuisines = async () => {
  const query = 'SELECT * FROM cuisines';
  const result = await pool.query(query);
  return result.rows;
};
