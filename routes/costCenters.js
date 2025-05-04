const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { identifyTenantFromParam } = require('../middleware/tenantMiddleware');
const {
  getCostCenters,
  getCostCenter,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter
} = require('../controllers/costCenterController');

// All routes require authentication
router.use(protect);
// Use tenant identification from URL parameter since the route includes tenantSlug
router.use(function(req, res, next) {
  return identifyTenantFromParam(req, res, next);
});

router.route('/')
  .get(getCostCenters)
  .post(createCostCenter);
  
router.route('/:id')
  .get(getCostCenter)
  .put(updateCostCenter)
  .delete(deleteCostCenter);

module.exports = router;
