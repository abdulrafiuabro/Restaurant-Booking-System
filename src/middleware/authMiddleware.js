import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { findUserByEmail } from '../models/user.js'; // Assuming the user model has this function

dotenv.config();

// Middleware to verify and decode the JWT token
export const LoggedInUser = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract the token from the "Authorization" header

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    
    // Fetch the user by email (from the decoded token)
    const user = await findUserByEmail(decoded.sub);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Attach the user to the request object
    req.user = user;

    // Call the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
