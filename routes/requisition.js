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
  addRequisitionItem,
  updateRequisitionItem,
  deleteRequisitionItem,
  getRequisitionItems,
  getRequisitionItemById
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

// Requisition items routes
router.route('/:id/items')
  .get(getRequisitionItems)
  .post(addRequisitionItem);

router.route('/items/:itemId')
  .get(getRequisitionItemById)
  .put(updateRequisitionItem)
  .delete(deleteRequisitionItem);

module.exports = router;
