const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { sendTokenResponse } = require('../utils/authUtils');
const { validationResult } = require('express-validator');
const { extractDomain } = require('../utils/domainUtils');

/**
 * @desc    Register user for specific tenant
 * @route   POST /api/v1/tenants/:tenantSlug/auth/register
 * @access  Public
 */
exports.registerUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const tenant = req.tenant;

    // Check if user with this email already exists for this tenant
    const existingUser = await User.findOne({ email, tenantId: tenant._id });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists for this tenant'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      tenantId: tenant._id,
      role: 'user' // Default role
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/tenants/:tenantSlug/auth/login
 * @access  Public
 */
exports.loginUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const tenant = req.tenant;

    // Check if user exists
    const user = await User.findOne({ email, tenantId: tenant._id }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Login user based on email domain
 * @route   POST /api/v1/auth/domain-login
 * @access  Public
 */
exports.domainBasedLogin = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Extract domain from email
    const domain = extractDomain(email);
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    // Find tenant by domain
    const tenant = await Tenant.findByDomain(domain);    if (!tenant) {
      return res.status(401).json({
        success: false,
        error: 'Your organization is not registered with us',
        domain: domain
      });
    }

    // Find user in this tenant
    const user = await User.findOne({ 
      email,
      tenantId: tenant._id 
    }).select('+password');

    // If user doesn't exist but domain is valid, consider auto-registration
    // or return specific error message
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Please register first',
        domain: domain,
        tenantSlug: tenant.slug, // Return the tenant slug for frontend redirection
        validDomain: true // Indicates the domain is valid but user needs to register
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Send token response with tenant info
    sendTokenResponse(user, 200, res, tenant);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    // User is already available from the middleware
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Log user out / clear cookie
 * @route   GET /api/v1/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  res.cookie('jwt', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};