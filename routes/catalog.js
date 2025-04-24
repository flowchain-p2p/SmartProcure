// filepath: c:\Soundar\Instatenders\multitenent\backend\routes\catalog.js
const express = require('express');
const router = express.Router();
const { getCatalogs, getCatalog, createCatalog } = require('../controllers/catalogController');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');

// Protect all routes with tenant identification
router.use(identifyTenantFromToken);

// Catalog routes
router.route('/')
  .get(getCatalogs)
  .post(createCatalog);

router.route('/:id')
  .get(getCatalog);

module.exports = router;
