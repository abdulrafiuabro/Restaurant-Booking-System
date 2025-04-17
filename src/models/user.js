import pkg from 'pg';
const { Pool } = pkg;

// PostgreSQL connection pool
const pool = new Pool();

export const createUser = async (name, email, phone, hashedPassword) => {
console.log("inside create user");
  const result = await pool.query(
    `INSERT INTO users (name, email, phone, hashed_password) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, email, phone, hashedPassword]
  );
  console.log("returning");
  return result.rows[0];
};

export const findUserByEmail = async (email) => {
    console.log("inside find user");
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};
