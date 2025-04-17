const express = require('express');
const { check } = require('express-validator');
const { createTenant, getTenants, getTenant, updateTenant, deleteTenant, getTenantStats, getPublicTenants } = require('../controllers/tenantController');
const { identifyTenantFromToken, authorize } = require('../middleware/tenantMiddleware');

const router = express.Router();

// Public endpoint to get all active tenants (limited information)
router.get('/public', getPublicTenants);

// Include auth routes for tenant-specific routes
const authRouter = require('./auth');
// Fix the route path to ensure proper parameter naming
router.use('/:tenantSlug/auth', authRouter);

// Create a new tenant
router.post('/', 
  [
    check('name', 'Name is required').not().isEmpty(),
    check('slug', 'Slug is required').not().isEmpty(),
    check('adminEmail', 'Please include a valid admin email').isEmail(),
    check('adminPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  createTenant
);

// Protected routes that require authentication
router.use(identifyTenantFromToken);

// Routes that require admin role
router.use(authorize('admin'));

// Get all tenants
router.get('/', getTenants);

// Get single tenant
router.get('/:id', getTenant);

// Update tenant
router.put('/:id', updateTenant);

// Delete tenant
router.delete('/:id', deleteTenant);

// Get tenant statistics
router.get('/:id/stats', getTenantStats);

module.exports = router;