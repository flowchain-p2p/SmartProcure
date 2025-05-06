const jwt = require('jsonwebtoken');
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
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if user is a cost center head (only add to token payload)
    if (decoded.isCostCenterHead !== undefined) {
      // Don't modify the actual user object, but add the flag to req.user
      const userObj = user.toObject();
      userObj.isCostCenterHead = decoded.isCostCenterHead;
      req.user = userObj;
    } else {
      // Add user to request
      req.user = user;
    }
    
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
