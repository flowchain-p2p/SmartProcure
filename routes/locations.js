const express = require('express');
const {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  setDefaultLocation
} = require('../controllers/locationController');

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');

const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(identifyTenantFromToken);

// Location routes
router
  .route('/')
  .get(getLocations)
  .post(authorize('Administrator'), createLocation);

router
  .route('/:id')
  .get(getLocation)
  .put(authorize('Administrator'), updateLocation)
  .delete(authorize('Administrator'), deleteLocation);

router
  .route('/:id/default')
  .put(authorize('Administrator'), setDefaultLocation);

module.exports = router;
