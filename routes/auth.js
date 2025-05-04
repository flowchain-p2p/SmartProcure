const express = require('express');
const { check } = require('express-validator');
const { registerUser, loginUser, getMe, logout, registerLocalUser, azureLogin, oktaLogin } = require('../controllers/authController');
const { identifyTenantFromParam, identifyTenantFromToken, identifyTenantFromEmail } = require('../middleware/tenantMiddleware');

const router = express.Router({ mergeParams: true });

// For routes that should be authenticated using a tenant slug in the URL
const useSlugRoute = (req, res, next) => {
  
  // If this is the login route and no tenant slug, use email domain
  if (req.path === '/login' && req.method === 'POST') {
    return identifyTenantFromEmail(req, res, next);
  }
  // If this is the login route and no tenant slug, use email domain
  if (req.path === '/domain-login' && req.method === 'POST') {
    return identifyTenantFromEmail(req, res, next);
  }
  // Check if tenantSlug exists in params (URL route contains tenant slug)
  if (req.params.tenantSlug) {
    return identifyTenantFromParam(req, res, next);
  }
  // For other routes without tenant slug, return error
  return res.status(400).json({
    success: false,
    error: 'Tenant identifier is required'
  });
};

// Use our custom middleware for route handling
router.use(useSlugRoute);

// Register a new user for a specific tenant
router.post('/register', 
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  registerUser
);

// Login a user for a specific tenant
router.post('/login', 
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  loginUser
);

// Get current logged in user
router.get('/me', identifyTenantFromToken, getMe);

// Logout user
router.get('/logout', logout);

// Local user registration
router.post('/register-local', registerLocalUser);

// Placeholder routes for Azure and Okta
router.get('/azure', azureLogin);
router.get('/okta', oktaLogin);

module.exports = router;