import express from 'express';
import { createUser, findUserByEmail } from '../models/user.js';
import { hashPassword, verifyPassword, createAccessToken, createRefreshToken, verifyToken } from '../security/security.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  const { name, email, phone, password } = req.body;
  console.log(name, email, phone, password);
  

  // Check if user exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    console.log("User exist");
    return res.status(400).json({ message: 'Email already registered' });
  }

  // Hash the password
  const hashedPassword = await hashPassword(password);
  console.log("hashed pass");
  // Create the user in the database
  const newUser = await createUser(name, email, phone, hashedPassword);

  res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await findUserByEmail(email);
  if (!user || !await verifyPassword(password, user.hashed_password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate tokens
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  res.json({ access_token: accessToken, refresh_token: refreshToken, token_type: 'bearer' });
});

// Refresh token
router.post('/refresh-token', (req, res) => {
  const { refresh_token } = req.body;
  const decoded = verifyToken(refresh_token);

  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }

  const accessToken = createAccessToken(decoded.sub);
  res.json({ access_token: accessToken, token_type: 'bearer' });
});

export default router;
