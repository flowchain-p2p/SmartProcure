const jose = require('jose');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { extractDomain } = require('../utils/domainUtils');

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
  try {    // Verify token using jose
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey);
      // Simplify ID handling - convert to string and use Mongoose's ObjectId conversion
    const userId = String(payload.id);
    
    // Log the ID for debugging
    console.log('User ID from token:', userId, 'Type:', typeof userId);
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'No user found with this id'
      });
    }

    const tenantId = String(payload.tenantId);
    
    // Log the ID for debugging
    console.log('User ID from token:', userId, 'Type:', typeof userId);
    // Check if tenant exists and is active
    const tenant = await Tenant.findById(tenantId);
    if (!tenant || !tenant.active) {
      return res.status(401).json({
        success: false,
        error: 'Tenant not found or inactive'
      });
    }

    // Add tenant and user to request
    req.user = user;
    req.tenant = tenant;

    next();  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
 * Middleware to identify tenant from email domain (used for login)
 */
exports.identifyTenantFromEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    // Extract domain from email
    const domain = extractDomain(email);
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    // Find tenant by domain
    const tenant = await Tenant.findByDomain(domain);
    if (!tenant) {
      return res.status(401).json({
        success: false,
        error: 'Your organization is not registered with us',
        domain: domain
      });
    }
    
    // Add tenant to request
    req.tenant = tenant;
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error identifying tenant from email'
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

    // need to handle in future
    // if (!roles.includes(req.user.role)) {
    //   return res.status(403).json({
    //     success: false,
    //     error: `User role ${req.user.role} is not authorized to access this route`
    //   });
    // }

    next();
  };
};