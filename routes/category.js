const express = require('express');
const router = express.Router();
const { 
  getCategories, 
  getCategory, 
  getCategoryChildren,
  createCategory, 
  updateCategory 
} = require('../controllers/categoryController');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');

// Protect all routes with tenant identification
router.use(identifyTenantFromToken);

// Category routes
router.route('/')
  .get(getCategories)
  .post(createCategory);

router.route('/:id')
  .get(getCategory)
  .put(updateCategory);

router.route('/:id/children')
  .get(getCategoryChildren);

module.exports = router;
