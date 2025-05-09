const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');
const approvalInstanceController = require('../controllers/approvalInstanceController');

// All routes are protected and tenant-specific
router.use(protect);
router.use(identifyTenantFromToken);

// Get all approval instances (with pagination and filtering)
router.get('/', approvalInstanceController.getApprovalInstances);

// Get approval instances assigned to the current user
router.get('/my-approvals', approvalInstanceController.getMyApprovalInstances);

// Get approval instances by requisition ID
router.get('/requisition/:requisitionId', approvalInstanceController.getApprovalInstancesByRequisitionId);

// Get approval history for a requisition
router.get('/history/:requisitionId', approvalInstanceController.getApprovalHistory);

// Get a specific approval instance by ID
router.get('/:id', approvalInstanceController.getApprovalInstanceById);

// Update an approval instance (admin only)
router.put('/:id', authorize('Administrator'), approvalInstanceController.updateApprovalInstance);

// Delete an approval instance (admin only)
router.delete('/:id', authorize('Administrator'), approvalInstanceController.deleteApprovalInstance);

module.exports = router;
