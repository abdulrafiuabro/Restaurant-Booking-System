import pool from '../database/database.js';

export const createBooking = async (bookingData) => {
  const { user_id, table_id, start_time, end_time, special_requests } = bookingData;

  // Check if user exists
  const userResult = await pool.query(`SELECT * FROM users WHERE id = $1`, [user_id]);
  if (userResult.rowCount === 0) {
    throw { status: 400, message: 'User not found' };
  }

  // Check if table exists
  const tableResult = await pool.query(`SELECT * FROM tables WHERE id = $1`, [table_id]);
  if (tableResult.rowCount === 0) {
    throw { status: 400, message: 'Table not found' };
  }

  const branchId = tableResult.rows[0].branch_id;

  // Check if branch exists
  const branchResult = await pool.query(`SELECT * FROM branches WHERE id = $1`, [branchId]);
  if (branchResult.rowCount === 0) {
    throw { status: 400, message: 'Branch not found' };
  }

  // Create new booking
  const insertQuery = `
    INSERT INTO bookings (user_id, table_id, start_time, end_time, special_requests, status)
    VALUES ($1, $2, $3, $4, $5, 'pending')
    RETURNING *;
  `;

  const result = await pool.query(insertQuery, [
    user_id,
    table_id,
    start_time,
    end_time,
    special_requests || null,
  ]);

  return result.rows[0];
};

export const updateBooking = async (bookingId, updateData) => {
    // Check if booking exists
    const bookingResult = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
    if (bookingResult.rowCount === 0) {
      throw { status: 404, message: 'Booking not found' };
    }
  
    const booking = bookingResult.rows[0];
  
    // Check if table exists
    const tableResult = await pool.query(`SELECT * FROM tables WHERE id = $1`, [booking.table_id]);
    if (tableResult.rowCount === 0) {
      throw { status: 400, message: 'Table not found' };
    }
  
    // Check if branch exists
    const branchResult = await pool.query(`SELECT * FROM branches WHERE id = $1`, [tableResult.rows[0].branch_id]);
    if (branchResult.rowCount === 0) {
      throw { status: 400, message: 'Branch not found' };
    }
  
    // Prepare update fields
    const fields = [];
    const values = [];
    let index = 1;
  
    for (const key of ['start_time', 'end_time', 'special_requests', 'status']) {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${index++}`);
        values.push(updateData[key]);
      }
    }
  
    if (fields.length === 0) {
      return booking; // No update needed
    }
  
    values.push(bookingId); // for WHERE clause
  
    const updateQuery = `
      UPDATE bookings
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING *;
    `;
  
    const updatedResult = await pool.query(updateQuery, values);
    return updatedResult.rows[0];
  };

  export const getUserBookings = async (userId, status) => {
    const now = new Date().toISOString(); // Get current time in ISO format
  
    let statusCondition = '';
    const values = [userId, now];
    
  
    switch (status) {
      case 'upcoming':
        console.log(values)
        statusCondition = `AND b.status = 'confirmed' AND b.start_time > $2`;
        break;
      case 'past':
        statusCondition = `AND b.status = 'confirmed' AND b.start_time < $2`;
        break;
      case 'pending':
        statusCondition = `AND b.status = 'pending' AND b.start_time > $2`;
        break;
      case 'cancelled':
        statusCondition = `AND b.status = 'cancelled'`;
        values.pop(); // we don't need $2 (now)
        break;
      default:
        throw { status: 400, message: 'Invalid status' };
    }
  
    const query = `
      SELECT
        b.id,
        r.name AS restaurant_name,
        br.address AS branch_address,
        t.max_capacity AS persons,
        t.table_number,
        t.floor,
        b.start_time,
        b.end_time,
        b.status
      FROM bookings b
      JOIN tables t ON b.table_id = t.id
      JOIN branches br ON t.branch_id = br.id
      JOIN restaurants r ON br.restaurant_id = r.id
      WHERE b.user_id = $1
      ${statusCondition}
      ORDER BY b.start_time DESC
    `;
  
    const result = await pool.query(query, values);
    return result.rows;
  };

  export const getBookingsByBranch = async (branchId, limit = 20, offset = 0) => {
  
    // 1. Check if branch exists
    const branchResult = await pool.query(`SELECT * FROM branches WHERE id = $1`, [branchId]);
    if (branchResult.rows.length === 0) {
      throw { status: 400, message: "Branch not found" };
    }
  
    // 3. Get bookings for branch with pagination
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM bookings b
      JOIN tables t ON b.table_id = t.id
      WHERE t.branch_id = $1
    `, [branchId]);
  
    const bookingsResult = await pool.query(`
      SELECT
        b.id,
        b.user_id,
        b.start_time,
        b.end_time,
        b.status,
        t.table_number,
        t.floor,
        t.max_capacity,
        u.name AS customer_name
      FROM bookings b
      JOIN tables t ON b.table_id = t.id
      JOIN users u ON b.user_id = u.id
      WHERE t.branch_id = $1
      ORDER BY b.start_time DESC
      LIMIT $2 OFFSET $3
    `, [branchId, limit, offset]);
  
    if (bookingsResult.rows.length === 0) {
      throw { status: 404, message: "No bookings found for the specified branch" };
    }
  
    return {
      total_count: parseInt(countResult.rows[0].count),
      limit,
      offset,
      bookings: bookingsResult.rows,
    };
  };

  export const deleteBookingById = async (bookingId) => {
    // 1. Get booking
    const bookingResult = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
    if (bookingResult.rows.length === 0) {
      throw { status: 404, message: "Booking not found" };
    }
    const booking = bookingResult.rows[0];
  
    // 3. Delete booking
    await pool.query(`DELETE FROM bookings WHERE id = $1`, [bookingId]);
  
    return { detail: `Booking ${bookingId} successfully deleted` };
  };
  