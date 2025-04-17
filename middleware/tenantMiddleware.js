const jwt = require('jsonwebtoken');
const Tenant = require('../models/Tenant');
const User = require('../models/User');

/**
 * Middleware to identify tenant from JWT token
 */
exports.identifyTenantFromToken = async (req, res, next) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'No user found with this id'
      });
    }

    // Check if tenant exists and is active
    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant || !tenant.active) {
      return res.status(401).json({
        success: false,
        error: 'Tenant not found or inactive'
      });
    }

    // Add tenant and user to request
    req.user = user;
    req.tenant = tenant;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

/**
 * Middleware to identify tenant from URL parameter (used for public routes)
 */
exports.identifyTenantFromParam = async (req, res, next) => {
  try {
    const { tenantSlug } = req.params;
    
    if (!tenantSlug) {
      return res.status(400).json({
        success: false,
        error: 'Tenant identifier is required'
      });
    }
    
    // Find tenant by slug
    const tenant = await Tenant.findOne({ slug: tenantSlug.toLowerCase(), active: true });
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found or inactive'
      });
    }
    
    // Add tenant to request
    req.tenant = tenant;
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error identifying tenant'
    });
  }
};

/**
 * Middleware to restrict access to specific roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found in request'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};