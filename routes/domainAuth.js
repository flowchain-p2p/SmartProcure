const express = require('express');
const { check } = require('express-validator');
const { domainBasedLogin } = require('../controllers/authController');

const router = express.Router();

// Domain-based login route
router.post('/domain-login', 
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  domainBasedLogin
);

module.exports = router;
