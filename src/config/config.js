import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

console.log("inside config");

const config = {
  // Build the database connection URL using the .env variables
  databaseUrl: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  
  // Cloudinary configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // JWT Configuration
  jwt: {
    secretKey: process.env.SECRET_KEY,
    accessTokenExpireMinutes: process.env.ACCESS_TOKEN_EXPIRE_MINUTES || 30,
    refreshTokenExpireDays: process.env.REFRESH_TOKEN_EXPIRE_DAYS || 7,
    algorithm: process.env.ALGORITHM || 'HS256',
  }
};
console.log(config.databaseUrl);

export default config;
