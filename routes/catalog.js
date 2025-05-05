const express = require('express');
const router = express.Router();
const {
  getCatalogs,
  getSubcatalogs,
  getBrands,
  searchProductsByName
} = require('../controllers/catalogController');
const { protect } = require('../middleware/authMiddleware');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');

// Apply authentication and tenant middleware to all routes
router.use(protect);
router.use(identifyTenantFromToken);

// Catalog routes
router.get('/', getCatalogs);
router.get('/:id/subcatalogs', getSubcatalogs);

// Brand routes
router.get('/brands', getBrands);

// Product search routes
router.get('/products/search', searchProductsByName);

module.exports = router;
