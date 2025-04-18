import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dexvgp7pa",
  api_key: "397815752359774",
  api_secret: "oKyRD2-F6QeMiZd-dAQ8UyBvwXY"
});

// Function to handle file upload to Cloudinary
export const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    ).end(fileBuffer);
  });
};
