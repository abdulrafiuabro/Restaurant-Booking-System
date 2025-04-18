import express from 'express';
import { createUser, findUserByEmail, updateUserPassword, getUsers, findUserById,updateUserInDB, deleteUserFromDB} from '../models/user.js';
import { hashPassword, verifyPassword, createAccessToken, createRefreshToken, verifyToken } from '../security/security.js';
import { LoggedInUser } from '../middleware/authMiddleware.js'; // Import the middleware
import { checkIfRoleExists, createRolesIfNotExists, getRoles } from '../models/role.js'; // Custom model functions



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
  if (!user || !await verifyPassword(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate tokens
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  res.json({ access_token: accessToken, refresh_token: refreshToken, token_type: 'bearer' });
});

router.post('/token', async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  // Find user by email
  const dbUser = await findUserByEmail(email);
  console.log(dbUser.password, dbUser.email);
  if (!dbUser || !(await verifyPassword(password, dbUser.password))) {
    return res.status(401).json({
      message: 'Invalid credentials',
      headers: { 'WWW-Authenticate': 'Bearer' },
    });
  }

  // Generate access and refresh tokens
  const accessToken = createAccessToken({ sub: dbUser.email });
  const refreshToken = createRefreshToken({ sub: dbUser.email });

  res.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
  });
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


router.post('/change-password', LoggedInUser, async (req, res) => {
  const { old_password, new_password } = req.body;

  // The user data is now available as req.user due to the LoggedInUser middleware
  const currentUser = req.user;

  // Verify old password
  const isPasswordValid = await verifyPassword(old_password, currentUser.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid old password' });
  }

  // Hash the new password
  const hashedPassword = await hashPassword(new_password);

  // Update the user's password in the database
  try {
    await updateUserPassword(currentUser.id, hashedPassword); // Function to update the password in the database
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/user', LoggedInUser, (req, res) => {
  try {
    return res.json(req.user); // Return the logged-in user's details
  } catch (error) {
    console.error('Error retrieving user details:', error);
    return res.status(500).json({ message: 'Failed to retrieve user details', error: error.message });
  }
});


router.post('/create-default-roles', async (req, res) => {
  const roleChoices = ['admin', 'owner', 'manager', 'staff', 'user'];

  try {
    // Check which roles already exist in the database
    const existingRoles = await checkIfRoleExists(roleChoices);

    // Find roles that don't exist
    const newRoles = roleChoices.filter(role => !existingRoles.includes(role));

    // If new roles exist, insert them into the database
    if (newRoles.length > 0) {
      await createRolesIfNotExists(newRoles);
    }

    res.json({ msg: 'Default roles created if not already present', roles: roleChoices });
  } catch (error) {
    console.error('Error creating default roles:', error);
    res.status(500).json({ message: 'Failed to create default roles' });
  }
});

// Get roles route
router.get('/roles', async (req, res) => {
  try {
    const roles = await getRoles();
    res.json(roles.rows); // Return all roles
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
});

// router.post('/create_staff_user', async (req, res) => {
//   const { name, email, phone, password, role_id, restaurant_id, branch_id } = req.body;

//   try {
//     // Check if the user already exists
//     const existingUserResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
//     if (existingUserResult.rows.length > 0) {
//       return res.status(400).json({ message: 'Email already registered' });
//     }

//     // Check if the role exists
//     const roleResult = await pool.query('SELECT * FROM roles WHERE id = $1', [role_id]);
//     if (roleResult.rows.length === 0) {
//       return res.status(400).json({ message: 'Invalid role ID' });
//     }

//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create a new user
//     const newUserResult = await pool.query(
//       'INSERT INTO users (name, email, phone, hashed_password) VALUES ($1, $2, $3, $4) RETURNING *',
//       [name, email, phone, hashedPassword]
//     );

//     const newUser = newUserResult.rows[0];

//     // Conditionally create EmployeeMapping (Skip if role is 'user')
//     if (roleResult.rows[0].name.toLowerCase() !== 'user') {
//       const employeeMappingResult = await pool.query(
//         'INSERT INTO employee_mappings (user_id, role_id, restaurant_id, branch_id) VALUES ($1, $2, $3, $4) RETURNING *',
//         [newUser.id, role_id, restaurant_id, branch_id]
//       );
//       const employeeMapping = employeeMappingResult.rows[0];
//     }

//     // Return the created staff user details
//     res.status(201).json({
//       id: newUser.id,
//       name: newUser.name,
//       email: newUser.email,
//       phone: newUser.phone,
//       restaurant_id: restaurant_id || null,
//       branch_id: branch_id || null,
//       role_id,
//       created_at: newUser.created_at,
//       updated_at: newUser.updated_at,
//     });
//   } catch (error) {
//     console.error('Error creating staff user:', error);
//     res.status(500).json({ message: 'Error creating staff user', error: error.message });
//   }
// });

router.get('/users', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;  // Default to 20 if no limit is provided
  const offset = parseInt(req.query.offset) || 0;  // Default to 0 if no offset is provided

  try {
    const { totalCount, users } = await getUsers(limit, offset); // Call the getUsers function

    // Return the response with total_count, limit, offset, and users data
    res.json({
      total_count: totalCount,
      limit: limit,
      offset: offset,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to retrieve user details', error: error.message });
  }
});

router.patch('/users/:user_id', LoggedInUser, async (req, res) => {
  const userId = parseInt(req.params.user_id);  // Extract user_id from route params
  const { name, email, phone } = req.body;  // Extract the fields to update from request body

  // Get the logged-in user
  const currentUser = req.user;

  try {
    // Check if the user exists
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the current user is authorized (either they are the same user or an admin)
    if (currentUser.id !== userId && !currentUser.role.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Update user data if authorized
    const updatedUser = await updateUserInDB(userId, { name, email, phone });

    // Return the updated user details
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user details', error: error.message });
  }
});

router.delete('/users/:user_id', LoggedInUser, async (req, res) => {
  const userId = parseInt(req.params.user_id);  // Extract user_id from route params
  const currentUser = req.user;  // Get the currently logged-in user

  try {
    // Check if the user exists
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the current user is authorized (either they are the same user or an admin)
    if (currentUser.id !== userId && !currentUser.role.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized to delete this user' });
    }

    // Delete the user
    await deleteUserFromDB(userId);

    // Return success message
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});


export default router;
