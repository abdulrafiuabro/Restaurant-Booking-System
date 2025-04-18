import express from 'express';
import { checkAdminPermission } from '../middleware/permission.js'; // Permissions middleware
import { getExistingCuisines, createCuisines } from '../models/cuisine.js'; // Import model functions
import { findUserById, findAdminRole, checkIfUserIsAdmin, assignAdminRoleToUser } from '../models/user.js';  // Import model functions
import {LoggedInUser} from '../middleware/authMiddleware.js';
import multer from 'multer'
import cloudinary from '../config/cloudinary.js';  // Cloudinary configuration
import { validateCuisines, createRestaurant, associateCuisinesWithRestaurant, getTotalRestaurantCount,getRestaurants} from '../models/restaurant.js';  // Import functions
import { uploadToCloudinary } from './uploadimg.js'; // Import Cloudinary upload function


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

// Get all restaurants

router.get('/', async (req, res) => {
  try {
    const { cuisine_ids, limit = 20, offset = 0 } = req.query;

    // Fetch the total count of restaurants
    const totalCount = await getTotalRestaurantCount({ cuisine_ids });

    // Fetch the restaurants with pagination
    const restaurants = await getRestaurants({ cuisine_ids, limit, offset });

    if (!restaurants.length) {
      return res.status(404).json({ message: 'No restaurants found' });
    }

    return res.json({
      total_count: totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
      restaurants: restaurants
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.post('/create-default-cuisines', LoggedInUser,checkAdminPermission, async (req, res) => {
  const cuisineChoices = [
    "Italian", "Chinese", "Indian", "Mexican", "American",
    "French", "Japanese", "Mediterranean", "Thai", "Spanish"
  ];

  try {
    // Check which cuisines already exist in the database
    const existingCuisines = await getExistingCuisines(cuisineChoices);

    // Find cuisines that don't exist
    const newCuisines = cuisineChoices.filter(cuisine => !existingCuisines.includes(cuisine));

    // If new cuisines exist, insert them into the database
    if (newCuisines.length > 0) {
      await createCuisines(newCuisines);
    }

    res.json({ msg: 'Default cuisines created if not already present', cuisines: cuisineChoices });
  } catch (error) {
    console.error('Error creating default cuisines:', error);
    res.status(500).json({ message: 'Failed to create default cuisines' });
  }
});

router.post('/assign-admin/:user_id',LoggedInUser,checkAdminPermission,async (req, res) => {
  const userId = parseInt(req.params.user_id);  // Get user_id from the request parameters

  try {
    // 1. Check if the user exists
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Check if the "admin" role exists
    const adminRole = await findAdminRole();
    if (!adminRole) {
      return res.status(404).json({ message: 'Admin role does not exist' });
    }

    // 3. Check if the user is already an admin
    const isUserAdmin = await checkIfUserIsAdmin(userId);
    if (isUserAdmin) {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    // 4. Assign the "admin" role to the user
    await assignAdminRoleToUser(userId, adminRole.id);

    // Respond with success message
    res.json({ message: 'Admin role assigned to user successfully' });
  } catch (error) {
    console.error('Error assigning admin role:', error);
    res.status(500).json({ message: 'Error assigning admin role', error: error.message });
  }
});

router.post('/create', upload.single('logo'), async (req, res) => {
  const { name, description, cuisine_ids } = req.body;
  const { file } = req;  // The uploaded file (logo)

  // Ensure the file exists
  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Parse cuisine_ids (comma-separated string) into a list of integers
  let cuisineIdsList;
  try {
    cuisineIdsList = cuisine_ids
      .trim()  // Trim any leading or trailing spaces
      .split(',')  // Split by commas
      .map(id => parseInt(id.trim()))  // Trim each id and convert to integer
      .filter(id => !isNaN(id));  // Remove any NaN values

    if (cuisineIdsList.length === 0) {
      throw new Error("No valid cuisine IDs provided");
    }
  } catch (error) {
    return res.status(400).json({ message: 'Cuisine IDs must be a comma-separated list of integers', error: error.message });
  }

  // Validate if the cuisines exist
  let cuisines;
  try {
    cuisines = await validateCuisines(cuisineIdsList);
    if (cuisines.length !== cuisineIdsList.length) {
      return res.status(400).json({ message: 'Some cuisine IDs are invalid' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error validating cuisines', error: error.message });
  }

  // Upload the logo image to Cloudinary
  let logoUrl;
  try {
    const result = await uploadToCloudinary(file.buffer);  // Upload image to Cloudinary
    logoUrl = result.secure_url;  // Get the Cloudinary URL
    console.log(logoUrl);
  } catch (error) {
    return res.status(500).json({ message: 'Error uploading logo image', error: error.message });
  }


  // Create the new restaurant in the database
  let newRestaurant;
  try {
    newRestaurant = await createRestaurant(name, description, logoUrl);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating restaurant', error: error.message });
  }

  // Associate the restaurant with cuisines
  try {
    await associateCuisinesWithRestaurant(newRestaurant.id, cuisineIdsList);
  } catch (error) {
    return res.status(500).json({ message: 'Error associating cuisines with restaurant', error: error.message });
  }

  // Return the newly created restaurant
  res.json({
    msg: 'Restaurant created successfully',
    restaurant: {
      id: newRestaurant.id,
      name: newRestaurant.name,
      cuisines: cuisines.map(cuisine => ({ id: cuisine.id, name: cuisine.name })),
      logo_url: logoUrl,
    },
  });
});



export default router;
