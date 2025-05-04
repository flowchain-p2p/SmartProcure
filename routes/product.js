const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct } = require('../controllers/productController');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');

// Protect all routes with tenant identification
router.use(identifyTenantFromToken);

// Product routes
router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProduct);

module.exports = router;
