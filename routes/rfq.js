// filepath: c:\Soundar\Instatenders\multitenent\backend\routes\rfq.js
const express = require('express');
const router = express.Router();
const { getRFQs, getRFQ, createRFQ } = require('../controllers/rfqController');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');

// Protect all routes with tenant identification
router.use(identifyTenantFromToken);

// RFQ routes
router.route('/')
  .get(getRFQs)
  .post(createRFQ);

router.route('/:id')
  .get(getRFQ);

module.exports = router;
