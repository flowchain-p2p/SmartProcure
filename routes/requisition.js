const express = require('express');
const router = express.Router();
const { 
  getRequisitions, 
  getRequisition, 
  createRequisition, 
  updateRequisition, 
  deleteRequisition, 
  submitRequisition, 
  approveRequisition
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

// If you want to add requisition item routes in the future,
// you'll need to implement the controller functions first

module.exports = router;
