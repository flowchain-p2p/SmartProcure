const express = require('express');
const { check } = require('express-validator');
const { domainBasedLogin } = require('../controllers/authController');
const { identifyTenantFromEmail } = require('../middleware/tenantMiddleware');

const router = express.Router();

// Domain-based login route
router.post('/domain-login', 
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  identifyTenantFromEmail,
  domainBasedLogin
);

module.exports = router;
