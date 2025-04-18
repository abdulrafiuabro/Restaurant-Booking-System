import express from 'express';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import restaurantRoutes from './routes/restaurant.js';  // Import the restaurant routes
import cusineRoutes from './routes/cuisine.js';


// Load environment variables
dotenv.config();

const app = express();

app.use(express.json()); // Middleware to parse JSON bodies

// Use routes
app.use('/auth', authRouter);
app.use('/restaurant',restaurantRoutes);
app.use('/cuisine',cusineRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the Authentication API');
});

export default app;
