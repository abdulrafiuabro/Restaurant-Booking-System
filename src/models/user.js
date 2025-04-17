import pool from '../database/database.js';

// Create a new user
export const createUser = async (name, email, phone, hashedPassword) => {
  const result = await pool.query(
    `INSERT INTO users (name, email, phone, hashed_password) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, email, phone, hashedPassword]
  );
  return result.rows[0];
};

// Find user by email
export const findUserByEmail = async (email) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    // Add a check to verify if the result is correctly returned
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
  
    return result.rows[0];
  };

// Find user with roles
export const findUserWithRole = async (email) => {
  const result = await pool.query(
    `SELECT u.*, r.name as role FROM users u
     JOIN employee_mappings em ON em.user_id = u.id
     JOIN roles r ON r.id = em.role_id
     WHERE u.email = $1`, 
    [email]
  );
  return result.rows[0];
};

export const updateUserPassword = async (userId, hashedPassword) => {
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING *',
      [hashedPassword, userId]
    );
  
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
  
    return result.rows[0];
  };

  export const getUsers = async (limit, offset) => {
    const query = `
      SELECT u.id, u.name, u.email, u.phone, 
             r.id as role_id, r.name as role_name,
             res.id as restaurant_id, res.name as restaurant_name,
             b.id as branch_id
      FROM users u
      LEFT JOIN employee_mappings em ON em.user_id = u.id
      LEFT JOIN roles r ON r.id = em.role_id
      LEFT JOIN restaurants res ON res.id = em.restaurant_id
      LEFT JOIN branches b ON b.id = em.branch_id
      LIMIT $1 OFFSET $2
    `;
  
    const usersResult = await pool.query(query, [limit, offset]);
  
    // Get total count of users for pagination
    const totalCountResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalCount = parseInt(totalCountResult.rows[0].count);
  
    return {
      totalCount,
      users: usersResult.rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: {
          id: user.role_id || 0,
          name: user.role_name || 'user',
        },
        restaurant: {
          id: user.restaurant_id || null,
          name: user.restaurant_name || null,
        },
        branch: {
          id: user.branch_id || null,
          name: user.branch_name || null,
        },
      }))
    };
  };

  export const findUserById = async (userId) => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    return result.rows[0];
  };
  
  // Update user data
  export const updateUserInDB = async (userId, updatedData) => {
    const { name, email, phone } = updatedData;
  
    const query = `
      UPDATE users 
      SET name = $1, email = $2, phone = $3
      WHERE id = $4
      RETURNING *;
    `;
    const result = await pool.query(query, [name, email, phone, userId]);
    return result.rows[0];

  };

  export const deleteUserFromDB = async (userId) => {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
    return result.rows[0]; // Return the deleted user if needed, else can return a success flag
  };