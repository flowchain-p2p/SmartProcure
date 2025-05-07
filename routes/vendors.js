const express = require('express');
const router = express.Router();
const { 
  getVendors, 
  getVendor, 
  createVendor, 
  updateVendor, 
  deleteVendor,
  getVendorCategories
} = require('../controllers/vendorController');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply middleware to all routes
router.use(protect);
router.use(identifyTenantFromToken);

// Get vendor categories (for dropdown lists)
router.get('/categories', getVendorCategories);

// Vendor routes
router
  .route('/')
  .get(getVendors)
  .post(createVendor);

router
  .route('/:id')
  .get(getVendor)
  .put(updateVendor)
  .delete(deleteVendor);

module.exports = router;
