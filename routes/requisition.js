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

// Protect all routes with tenant identification
router.use(identifyTenantFromToken);

// Requisition routes
router.route('/')
  .get(getRequisitions)
  .post(createRequisition);

router.route('/:id')
  .get(getRequisition)
  .put(updateRequisition)
  .delete(deleteRequisition);

// Special actions
router.route('/:id/submit')
  .patch(submitRequisition);

router.route('/:id/approve')
  .patch(approveRequisition);

// If you want to add requisition item routes in the future,
// you'll need to implement the controller functions first

module.exports = router;
