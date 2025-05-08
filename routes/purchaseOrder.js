const express = require('express');
const router = express.Router();
const { 
  getPurchaseOrders, 
  getPurchaseOrder, 
  createPurchaseOrder, 
  updatePurchaseOrder, 
  deletePurchaseOrder, 
  issuePurchaseOrder,
  markPurchaseOrderDelivered,
  completePurchaseOrder,
  cancelPurchaseOrder
} = require('../controllers/purchaseOrderController');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');
const { hasPermission } = require('../middleware/permissionMiddleware');

// Protect all routes with tenant identification
router.use(identifyTenantFromToken);

// Purchase Order routes
router.route('/')
  .get(hasPermission('po.view'), getPurchaseOrders)
  .post(hasPermission('po.create'), createPurchaseOrder);

router.route('/:id')
  .get(hasPermission('po.view'), getPurchaseOrder)
  .put(hasPermission('po.edit'), updatePurchaseOrder)
  .delete(hasPermission('po.delete'), deletePurchaseOrder);

// Status change routes
router.route('/:id/issue')
  .patch(hasPermission('po.issue'), issuePurchaseOrder);

router.route('/:id/deliver')
  .patch(hasPermission('po.deliver'), markPurchaseOrderDelivered);

router.route('/:id/complete')
  .patch(hasPermission('po.complete'), completePurchaseOrder);

router.route('/:id/cancel')
  .patch(hasPermission('po.cancel'), cancelPurchaseOrder);

module.exports = router;
