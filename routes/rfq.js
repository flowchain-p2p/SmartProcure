const express = require('express');
const router = express.Router();
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

// Custom middleware to check RFQ status before applying specific permissions
const checkRfqStatusPermission = (statusPermissionMap) => {
  return async (req, res, next) => {
    try {
      const rfq = await require('../models/RFQ').findById(req.params.id);
      if (!rfq) {
        return res.status(404).json({ success: false, message: 'RFQ not found' });
      }
      
      const status = rfq.status;
      const requiredPermission = statusPermissionMap[status] || statusPermissionMap.default;
      
      return hasPermission(requiredPermission)(req, res, next);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
};

router.route('/:id')
  .get(hasPermission('rfq.view'), getRFQ)
  // Different permissions based on status for update operations
  .put(checkRfqStatusPermission({
    'Draft': 'rfq.edit_draft',
    default: 'rfq.view'  // Read-only for other statuses
  }), updateRFQ)
  // Only allow deletion of draft RFQs
  .delete(hasPermission('rfq.delete_draft'), deleteRFQ);

// Status change routes
router.route('/:id/issue')
  .patch(hasPermission('rfq.issue'), issueRFQ);

router.route('/:id/deliver')
  .patch(hasPermission('rfq.deliver'), markRFQDelivered);

router.route('/:id/complete')
  .patch(hasPermission('rfq.complete'), completeRFQ);

router.route('/:id/cancel')
  .patch(checkRfqStatusPermission({
    'Issued': 'rfq.cancel_issued',
    'Delivered': 'rfq.cancel_delivered',
    default: 'rfq.view'  // No cancelation permission for other statuses
  }), cancelRFQ);

// Vendor management routes
router.route('/:id/vendors')
  .post(hasPermission('rfq.add_vendor'), addVendorToRFQ);

router.route('/:id/vendors/:vendorId')
  .put(hasPermission('rfq.update_vendor_quote'), updateVendorQuote);

router.route('/:id/award/:vendorId')
  .patch(hasPermission('rfq.award'), awardRFQ);

module.exports = router;
