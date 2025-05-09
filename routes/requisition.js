const express = require('express');
const router = express.Router();
const { 
  getRequisitions, 
  getRequisition, 
  createRequisition, 
  updateRequisition, 
  deleteRequisition, 
  submitRequisition, 
  approveRequisition,
  getPendingCostCenterApprovals,
  getPendingApprovals,
  addRequisitionItem,
  updateRequisitionItem,
  deleteRequisitionItem,
  getRequisitionItems,
  getRequisitionItemById,
  getRequisitionApprovalStatus,
  // New simple approval functions
  submitRequisitionForApproval,
  getMyPendingApprovals,
  processApprovalDecision
} = require('../controllers/requisitionController');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');
const { hasPermission } = require('../middleware/permissionMiddleware');

// Protect all routes with tenant identification
router.use(identifyTenantFromToken);

// Requisition routes
router.route('/')
  .get(hasPermission('pr.view'), getRequisitions)
  .post(hasPermission('pr.create'), createRequisition);

router.route('/:id')
  .get(hasPermission('pr.view'), getRequisition)
  .put(hasPermission('pr.edit'), updateRequisition)
  .delete(hasPermission('pr.delete'), deleteRequisition);

// Special actions
router.route('/:id/submit')
  .patch(hasPermission('pr.submit'), submitRequisition);

router.route('/:id/approve')
  .patch(hasPermission('pr.approve'), approveRequisition);
  
// New simple approval routes
router.route('/:id/submit-for-approval')
  .post(hasPermission('pr.submit'), submitRequisitionForApproval);
  
router.route('/my-pending-approvals')
  .get(hasPermission('pr.approve'), getMyPendingApprovals);
  
router.route('/:id/approval-decision')
  .post(hasPermission('pr.approve'), processApprovalDecision);

// Approval status route
router.route('/:id/approval-status')
  .get(hasPermission('pr.view'), getRequisitionApprovalStatus);

// Requisition items routes
router.route('/:id/items')
  .get(hasPermission('pr.view'), getRequisitionItems)
  .post(hasPermission('pr.edit'), addRequisitionItem);

router.route('/items/:itemId')
  .get(hasPermission('pr.view'), getRequisitionItemById)
  .put(hasPermission('pr.edit'), updateRequisitionItem)
  .delete(hasPermission('pr.edit'), deleteRequisitionItem);

// Approval related routes
router.route('/pending-approvals/cost-center')
  .get(hasPermission('pr.approve'), getPendingCostCenterApprovals);

router.route('/pending-approvals')
  .get(hasPermission('pr.approve'), getPendingApprovals);

module.exports = router;
