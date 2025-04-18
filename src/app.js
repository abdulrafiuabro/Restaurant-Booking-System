import express from 'express';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import restaurantRoutes from './routes/restaurant.js';  // Import the restaurant routes


// Load environment variables
dotenv.config();

const app = express();

app.use(express.json()); // Middleware to parse JSON bodies

// Use routes
app.use('/auth', authRouter);
app.use('/restaurant',restaurantRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the Authentication API');
});

export default app;
