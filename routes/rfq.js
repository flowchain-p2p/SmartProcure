const express = require('express');
const router = express.Router();
// RFQ routes
const { 
  getRFQs, 
  getRFQ, 
  createRFQ, 
  updateRFQ, 
  deleteRFQ, 
  issueRFQ,
  markRFQDelivered,
  completeRFQ,
  cancelRFQ,
  addVendorToRFQ,
  updateVendorQuote,
  awardRFQ
} = require('../controllers/rfqController');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');
const { hasPermission } = require('../middleware/permissionMiddleware');

// Protect all routes with tenant identification
router.use(identifyTenantFromToken);

// RFQ routes
router.route('/')
  .get(hasPermission('rfq.view'), getRFQs)
  .post(hasPermission('rfq.create'), createRFQ);

// No longer need status-specific permissions as we've simplified them

router.route('/:id')
  .get(hasPermission('rfq.view'), getRFQ)
  // Use simple edit permission for all update operations
  .put(hasPermission('rfq.edit'), updateRFQ)
  // Use edit permission for delete operations
  .delete(hasPermission('rfq.edit'), deleteRFQ);

// Status change routes - all mapped to simplified permissions
router.route('/:id/issue')
  .patch(hasPermission('rfq.submit'), issueRFQ);

router.route('/:id/deliver')
  .patch(hasPermission('rfq.submit'), markRFQDelivered);

router.route('/:id/complete')
  .patch(hasPermission('rfq.submit'), completeRFQ);

router.route('/:id/cancel')
  .patch(hasPermission('rfq.cancel'), cancelRFQ);

// Vendor management routes - mapped to simplified permissions
router.route('/:id/vendors')
  .post(hasPermission('rfq.edit'), addVendorToRFQ);

router.route('/:id/vendors/:vendorId')
  .put(hasPermission('rfq.edit'), updateVendorQuote);

router.route('/:id/award/:vendorId')
  .patch(hasPermission('rfq.award'), awardRFQ);

module.exports = router;
