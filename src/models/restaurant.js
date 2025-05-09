import pool from '../database/database.js';  // Import the pool for DB queries

// Function to validate if the provided cuisines exist in the database
export const validateCuisines = async (cuisineIdsList) => {
  const query = 'SELECT * FROM cuisines WHERE id = ANY($1)';
  const result = await pool.query(query, [cuisineIdsList]);
  return result.rows;  // Return an array of cuisine records
};

// Function to create a new restaurant
export const createRestaurant = async (name, description, logoUrl) => {
  const query = `
    INSERT INTO restaurants (name, description, logo)
    VALUES ($1, $2, $3) RETURNING *`;
  const result = await pool.query(query, [name, description, logoUrl]);
  return result.rows[0];  // Return the newly created restaurant record
};

// Function to associate cuisines with a restaurant
export const associateCuisinesWithRestaurant = async (restaurantId, cuisineIdsList) => {
  const query = `
    INSERT INTO restaurant_cuisines (restaurant_id, cuisine_id)
    VALUES ($1, $2)`;
  
  // Loop through the cuisineIdsList and insert each cuisine for the restaurant
  for (let cuisineId of cuisineIdsList) {
    await pool.query(query, [restaurantId, cuisineId]);
  }
};

// Function to get all restaurants with pagination and filtering by cuisine_ids
export const getRestaurants = async ({ cuisine_ids, limit, offset }) => {
    let query = `
      SELECT DISTINCT r.id, r.name, r.description, r.logo
      FROM restaurants r
      LEFT JOIN restaurant_cuisines rc ON r.id = rc.restaurant_id
      LEFT JOIN cuisines c ON rc.cuisine_id = c.id
      WHERE 1=1
    `;
  
    // Filter by cuisine_ids if provided
    if (cuisine_ids) {
      const cuisineIdsList = cuisine_ids.split(',').map(id => id.trim());
      query += ` AND c.id IN (${cuisineIdsList.join(',')})`;
    }
  
    // Pagination (limit and offset)
    query += ` LIMIT $1 OFFSET $2`;
  
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  };
  
  // Function to get total count of restaurants
  export const getTotalRestaurantCount = async ({ cuisine_ids }) => {
    let query = `
      SELECT COUNT(DISTINCT r.id) AS total_count
      FROM restaurants r
      LEFT JOIN restaurant_cuisines rc ON r.id = rc.restaurant_id
      LEFT JOIN cuisines c ON rc.cuisine_id = c.id
      WHERE 1=1
    `;
  
    if (cuisine_ids) {
      const cuisineIdsList = cuisine_ids.split(',').map(id => id.trim());
      query += ` AND c.id IN (${cuisineIdsList.join(',')})`;
    }
  
    const result = await pool.query(query);
    return result.rows[0].total_count;
  };

  // Function to fetch a restaurant by ID
export const getRestaurantById = async (restaurantId) => {
  const restaurantRes = await pool.query("SELECT * FROM restaurants WHERE id = $1", [restaurantId]);
  const restaurant = restaurantRes.rows[0];

  if (!restaurant) return null;

  const cuisineRes = await pool.query(
    `SELECT c.id, c.name
     FROM cuisines c
     JOIN restaurant_cuisines rc ON c.id = rc.cuisine_id
     WHERE rc.restaurant_id = $1`,
    [restaurantId]
  );

  restaurant.cuisines = cuisineRes.rows;
  return restaurant;
  };
  
  // Function to update a restaurant's details
  export const updateRestaurantDetails = async (id, fields) => {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    if (keys.length === 0) return;
  
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    await pool.query(
      `UPDATE restaurants SET ${setClause} WHERE id = $${keys.length + 1}`,
      [...values, id]
    );
  }
  
  // Function to get cuisines by IDs
  export const getCuisinesByIds = async (cuisineIds) => {
    const query = `SELECT * FROM cuisines WHERE id = ANY($1::int[])`;
    const result = await pool.query(query, [cuisineIds]);
    return result.rows;
  };
  
  // Function to associate cuisines with the restaurant
  export const updateRestaurantCuisines = async (restaurantId, cuisineIds) => {
    // First, remove all existing cuisines associated with the restaurant
    await pool.query('DELETE FROM restaurant_cuisines WHERE restaurant_id = $1', [restaurantId]);
  
    // Now, insert new cuisine associations
    const query = `
      INSERT INTO restaurant_cuisines (restaurant_id, cuisine_id)
      SELECT $1, unnest($2::int[])
    `;
    await pool.query(query, [restaurantId, cuisineIds]);
  };