import pool from '../database/database.js';

export const createTable = async (tableData) => {
  const {
    branch_id,
    table_number,
    max_capacity,
    is_side_table,
    is_open_space,
    floor
  } = tableData;

  // Check if the branch exists
  const branchResult = await pool.query(`SELECT * FROM branches WHERE id = $1`, [branch_id]);
  if (branchResult.rowCount === 0) {
    throw new Error('Branch not found');
  }

  try {
    const query = `
      INSERT INTO tables 
        (branch_id, table_number, max_capacity, is_side_table, is_open_space, floor)
      VALUES 
        ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [branch_id, table_number, max_capacity, is_side_table, is_open_space, floor];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      // Unique violation (e.g., table number already exists in branch)
      throw new Error('Table number already exists in this branch');
    }
    throw err;
  }
};

export const getTablesByBranch = async (branch_id, limit = 20, offset = 0) => {
    // Check if branch exists
    const branchCheck = await pool.query(`SELECT id FROM branches WHERE id = $1`, [branch_id]);
    if (branchCheck.rowCount === 0) {
      throw new Error("Branch not found");
    }
  
    // Get total count
    const countResult = await pool.query(`SELECT COUNT(*) FROM tables WHERE branch_id = $1`, [branch_id]);
    const total_count = parseInt(countResult.rows[0].count, 10);
  
    // Fetch paginated tables
    const tableResult = await pool.query(
      `SELECT * FROM tables WHERE branch_id = $1 ORDER BY id LIMIT $2 OFFSET $3`,
      [branch_id, limit, offset]
    );
  
    if (tableResult.rows.length === 0) {
      throw new Error("No tables found for the specified branch");
    }
  
    return {
      total_count,
      limit,
      offset,
      tables: tableResult.rows
    };
  };

  export const updateTable = async (table_id, updateData) => {
    // Check if the table exists
    const tableRes = await pool.query(`SELECT * FROM tables WHERE id = $1`, [table_id]);
    if (tableRes.rowCount === 0) {
      throw new Error("Table not found");
    }
    const existingTable = tableRes.rows[0];
  
    // Check if the branch exists
    const branchRes = await pool.query(`SELECT * FROM branches WHERE id = $1`, [existingTable.branch_id]);
    if (branchRes.rowCount === 0) {
      throw new Error("Branch not found");
    }
  
    const {
      table_number,
      max_capacity,
      is_side_table,
      is_open_space,
      floor
    } = updateData;
  
    // If table number is changing, check for conflicts
    if (
      table_number !== undefined &&
      table_number !== existingTable.table_number
    ) {
      const duplicateCheck = await pool.query(
        `SELECT * FROM tables WHERE table_number = $1 AND branch_id = $2`,
        [table_number, existingTable.branch_id]
      );
      if (duplicateCheck.rowCount > 0) {
        throw new Error("Table number already exists in the same branch");
      }
    }
  
    // Build dynamic update query
    const fields = [];
    const values = [];
    let index = 1;
  
    if (table_number !== undefined) {
      fields.push(`table_number = $${index++}`);
      values.push(table_number);
    }
    if (max_capacity !== undefined) {
      fields.push(`max_capacity = $${index++}`);
      values.push(max_capacity);
    }
    if (is_side_table !== undefined) {
      fields.push(`is_side_table = $${index++}`);
      values.push(is_side_table);
    }
    if (is_open_space !== undefined) {
      fields.push(`is_open_space = $${index++}`);
      values.push(is_open_space);
    }
    if (floor !== undefined) {
      fields.push(`floor = $${index++}`);
      values.push(floor);
    }
  
    if (fields.length === 0) {
      return existingTable; // Nothing to update
    }
  
    values.push(table_id); // last param for WHERE
    const query = `
      UPDATE tables
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING *;
    `;
    const updated = await pool.query(query, values);
    return updated.rows[0];
  };

  export const getAvailableTables = async (branch_id, number_of_persons, start_time, end_time) => {
    const query = `
      SELECT *
      FROM tables t
      WHERE t.branch_id = $1
        AND t.max_capacity >= $2
        AND NOT EXISTS (
          SELECT 1
          FROM bookings b
          WHERE b.table_id = t.id
            AND b.start_time < $4
            AND b.end_time > $3
        )
    `;
  
    const result = await pool.query(query, [branch_id, number_of_persons, start_time, end_time]);
    return result.rows;
  };