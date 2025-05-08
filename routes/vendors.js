const express = require('express');
const router = express.Router();
const { 
  getVendors, 
  getVendor, 
  createVendor, 
  updateVendor, 
  deleteVendor,
  getVendorCategories,
  associateVendorWithCategories,
  removeVendorFromCategory,
  getVendorCategoriesById,
  getVendorsByCategory
} = require('../controllers/vendorController');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');
const { hasPermission } = require('../middleware/permissionMiddleware');

// Apply middleware to all routes
router.use(protect);
router.use(identifyTenantFromToken);

// Get vendor categories (for dropdown lists)
router.get('/categories', hasPermission('supplier.view'), getVendorCategories);

// Vendor routes
router
  .route('/')
  .get(hasPermission('supplier.view'), getVendors)
  .post(hasPermission('supplier.create'), createVendor);

router
  .route('/:id')
  .get(hasPermission('supplier.view'), getVendor)
  .put(hasPermission('supplier.edit'), updateVendor)
  .delete(hasPermission('supplier.edit'), deleteVendor);

// Vendor-category relationship routes
router
  .route('/:id/categories')
  .get(hasPermission('supplier.view'), getVendorCategoriesById)
  .post(hasPermission('supplier.edit'), associateVendorWithCategories);

router
  .route('/:id/categories/:categoryId')
  .delete(hasPermission('supplier.edit'), removeVendorFromCategory);

module.exports = router;
