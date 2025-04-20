import pool from '../database/database.js';

export const createBranch = async (restaurant_id, city, country, address, location) => {
  // Check if the restaurant exists
  const checkQuery = 'SELECT * FROM restaurants WHERE id = $1';
  const restaurantRes = await pool.query(checkQuery, [restaurant_id]);

  if (restaurantRes.rowCount === 0) {
    throw new Error("Restaurant not found");
  }

  // Insert the new branch
  const insertQuery = `
    INSERT INTO branches (restaurant_id, city, country, address, location)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`;
  const result = await pool.query(insertQuery, [restaurant_id, city, country, address, location]);

  return result.rows[0]; // Return the created branch
};

export const getBranches = async ({ restaurant_id, city, limit = 20, offset = 0 }) => {
  let baseQuery = `SELECT * FROM branches`;
  let countQuery = `SELECT COUNT(*) FROM branches`;
  const values = [];
  const conditions = [];

  if (restaurant_id) {
    values.push(restaurant_id);
    conditions.push(`restaurant_id = $${values.length}`);
  }

  if (city) {
    values.push(`%${city}%`);
    conditions.push(`city ILIKE $${values.length}`);
  }

  if (conditions.length > 0) {
    baseQuery += ` WHERE ` + conditions.join(" AND ");
    countQuery += ` WHERE ` + conditions.join(" AND ");
  }

  baseQuery += ` OFFSET $${values.length + 1} LIMIT $${values.length + 2}`;
  values.push(offset);
  values.push(limit);

  const branchesResult = await pool.query(baseQuery, values);
  const countResult = await pool.query(countQuery, values.slice(0, values.length - 2));

  return {
    total_count: parseInt(countResult.rows[0].count),
    limit,
    offset,
    branches: branchesResult.rows,
  };
};

export const updateBranch = async (branch_id, updateFields) => {
    // If no fields provided
    if (Object.keys(updateFields).length === 0) {
      throw new Error("No fields provided to update");
    }
  
    const setClauses = [];
    const values = [];
  
    Object.entries(updateFields).forEach(([key, value], index) => {
      setClauses.push(`${key} = $${index + 1}`);
      values.push(value);
    });
  
    // Add branch_id at the end for WHERE clause
    values.push(branch_id);
  
    const query = `
      UPDATE branches
      SET ${setClauses.join(", ")}
      WHERE id = $${values.length}
      RETURNING *;
    `;
  
    const result = await pool.query(query, values);
  
    if (result.rowCount === 0) {
      throw new Error("Branch not found");
    }
  
    return result.rows[0];
  };

  export const getFilteredBranches = async ({ city, cuisine_ids, search, limit = 20, offset = 0 }) => {
    if (!city) throw new Error("City is required");
  
    const values = [];
    let whereClause = `b.city = $1`;
    values.push(city);
  
    let joinClause = `
      INNER JOIN restaurants r ON b.restaurant_id = r.id
    `;
  
    if (cuisine_ids && cuisine_ids.length > 0) {
      joinClause += `
        INNER JOIN restaurant_cuisines rc ON r.id = rc.restaurant_id
        INNER JOIN cuisines c ON rc.cuisine_id = c.id
      `;
      const placeholders = cuisine_ids.map((_, i) => `$${values.length + i + 1}`);
      whereClause += ` AND rc.cuisine_id IN (${placeholders.join(", ")})`;
      values.push(...cuisine_ids);
    }
  
    if (search) {
      values.push(`%${search}%`);
      whereClause += ` AND r.name ILIKE $${values.length}`;
    }
  
    const countQuery = `
      SELECT COUNT(DISTINCT b.id) AS total
      FROM branches b
      ${joinClause}
      WHERE ${whereClause}
    `;
  
    const dataQuery = `
      SELECT DISTINCT b.*
      FROM branches b
      ${joinClause}
      WHERE ${whereClause}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
  
    values.push(limit);
    values.push(offset);
  
    const totalResult = await pool.query(countQuery, values.slice(0, values.length - 2));
    const dataResult = await pool.query(dataQuery, values);
  
    return {
      total_count: parseInt(totalResult.rows[0].total),
      limit,
      offset,
      branches: dataResult.rows,
    };
  };

  export const getRecommendedBranches = async ({ restaurant_id, city, branch_id, limit = 10 }) => {
    // Step 1: Get cuisines of the given restaurant
    const cuisineResult = await pool.query(
      `SELECT cuisine_id FROM restaurant_cuisines WHERE restaurant_id = $1`,
      [restaurant_id]
    );
  
    const cuisine_ids = cuisineResult.rows.map(row => row.cuisine_id);
    if (cuisine_ids.length === 0) {
      throw new Error("No cuisines found for the given restaurant");
    }
  
    // Step 2: Get branches in the same city with any matching cuisine, excluding the same branch only
    const placeholders = cuisine_ids.map((_, i) => `$${i + 3}`).join(",");
    const values = [city, branch_id, ...cuisine_ids];
  
    const query = `
      SELECT DISTINCT b.*, r.name AS restaurant_name
      FROM branches b
      INNER JOIN restaurants r ON b.restaurant_id = r.id
      INNER JOIN restaurant_cuisines rc ON r.id = rc.restaurant_id
      WHERE b.city = $1
        AND b.id != $2
        AND rc.cuisine_id IN (${placeholders})
      LIMIT $${values.length + 1}
    `;
    values.push(limit);
  
    const result = await pool.query(query, values);
    return result.rows;
  };