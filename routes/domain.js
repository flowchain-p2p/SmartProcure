const express = require('express');
const { check } = require('express-validator');
const { checkDomain } = require('../controllers/domainController');

const router = express.Router();

// Domain check route
router.post('/check', 
  [check('email', 'Please include a valid email').isEmail()],
  checkDomain
);

module.exports = router;
