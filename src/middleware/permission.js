
  export const checkAdminPermission = (req, res, next) => {
    console.log("in checkadminperm " + req.user);  // Log the user object for debugging
  
    if (!req.user || req.user.role_name.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission' });
    }
  
    next();  // Proceed to the next middleware or route handler
  };