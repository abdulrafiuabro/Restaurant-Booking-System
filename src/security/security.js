import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Hash password
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Verify password
export const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

// Create access token
export const createAccessToken = (data) => {
  const payload = { sub: data.email };
  return jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES}m`,
  });
};

// Create refresh token
export const createRefreshToken = (data) => {
  const payload = { sub: data.email };
  return jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: `${process.env.REFRESH_TOKEN_EXPIRE_DAYS}d`,
  });
};

// Verify token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.SECRET_KEY);
  } catch (error) {
    return null;
  }
};
