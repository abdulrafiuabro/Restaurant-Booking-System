import pool from '../database/database.js';

// Function to check if the roles already exist in the database
export const checkIfRoleExists = async (roleNames) => {
  const query = `
    SELECT name 
    FROM roles 
    WHERE name = ANY($1)
  `;
  const result = await pool.query(query, [roleNames]);
  return result.rows.map(row => row.name); // Returns an array of existing role names
};

// Function to create roles if they do not exist
export const createRolesIfNotExists = async (newRoles) => {
  const query = `
    INSERT INTO roles (name) 
    SELECT unnest($1::text[])
    WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = ANY($1::text[]))
  `;
  await pool.query(query, [newRoles]);
};

export const getRoles = async ()=>{
    try {
        const roles = await pool.query('SELECT * FROM roles');
        return roles; // Return all roles
      } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ message: 'Failed to fetch roles' });
      }

}