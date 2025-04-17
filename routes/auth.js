const express = require('express');
const { check } = require('express-validator');
const { registerUser, loginUser, getMe, logout } = require('../controllers/authController');
const { identifyTenantFromParam, identifyTenantFromToken } = require('../middleware/tenantMiddleware');

const router = express.Router({ mergeParams: true });

// Identify tenant from URL parameter for public routes
router.use(identifyTenantFromParam);

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

module.exports = router;