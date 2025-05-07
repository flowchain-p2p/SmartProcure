// Using dynamic import for jose as it's an ES Module
const User = require('../models/User');

/**
 * Protect routes - Authentication middleware
 */
exports.protect = async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Get token from cookie
  else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
  try {
    // Dynamic import for jose (ES Module)
    const { jwtVerify } = await import('jose');
    
    // Verify token using jose
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);

    // Ensure we have a string ID
    const userId = String(payload.id);
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

/**
 * Authorize by role
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userRoles = req.user.roles || []; // Assuming roles is an array in your User model

    // Check if any of the user's roles match the authorized roles
    const authorized = roles.some(role => userRoles.includes(role));

    if (!authorized) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }

    next();
  };
};
