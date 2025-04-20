import express from 'express';
import { createBooking, updateBooking, getUserBookings, getBookingsByBranch,  deleteBookingById } from '../models/bookings.js';
import { LoggedInUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const bookingData = req.body;

  try {
    const newBooking = await createBooking(bookingData);
    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    res.status(status).json({ detail: message });
  }
});

router.patch('/:bookingId', async (req, res) => {
    const bookingId = parseInt(req.params.bookingId);
    const updateData = req.body;
  
    try {
      const updatedBooking = await updateBooking(bookingId, updateData);
      res.json(updatedBooking);
    } catch (error) {
      console.error('Error updating booking:', error);
      const status = error.status || 500;
      const message = error.message || 'Internal server error';
      res.status(status).json({ detail: message });
    }
  });

  router.get('/user_bookings',LoggedInUser, async (req, res) => {
    console.log("Request User:", JSON.stringify(req.user, null, 2));

    const userId = req.user.id; // Assuming you have middleware that sets req.user
    const { status } = req.query;
  
    const allowed = ['upcoming', 'past', 'pending', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ detail: 'Invalid status filter' });
    }
  
    try {
      const bookings = await getUserBookings(userId, status);
  
      if (bookings.length === 0) {
        return res.status(404).json({ detail: 'No bookings found' });
      }
  
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      const code = error.status || 500;
      const msg = error.message || 'Internal server error';
      res.status(code).json({ detail: msg });
    }
  });

  router.get('/:branchId', async (req, res) => {
    const { branchId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);
  
    try {
      const data = await getBookingsByBranch(parseInt(branchId, 10), parsedLimit, parsedOffset);
      res.json(data);
    } catch (error) {
      console.error('Error fetching branch bookings:', error);
      const code = error.status || 500;
      const msg = error.message || 'Internal server error';
      res.status(code).json({ detail: msg });
    }
  });

  router.delete('/:bookingId', async (req, res) => {
    const { bookingId } = req.params;
  
    try {
      const result = await deleteBookingById(parseInt(bookingId, 10));
      res.json(result);
    } catch (error) {
      console.error('Error deleting booking:', error);
      const code = error.status || 500;
      const msg = error.message || 'Internal server error';
      res.status(code).json({ detail: msg });
    }
  });

export default router;