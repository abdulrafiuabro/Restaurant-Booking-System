import multer from 'multer';

// Set up multer for file storage
const storage = multer.memoryStorage();  // Store the file in memory
const upload = multer({ storage: storage });

export default upload;
