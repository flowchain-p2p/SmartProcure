const express = require('express');
const router = express.Router();
const { 
  getSupplierOrders, 
  getSupplierOrder, 
  createSupplierOrder, 
  updateSupplierOrder, 
  deleteSupplierOrder,
  updateSupplierQuote,
  updatePODetails,
  updateDeliveryStatus,
  changeOrderStatus 
} = require('../controllers/supplierOrderController');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { hasPermission } = require('../middleware/permissionMiddleware');

// Apply middleware to all routes
router.use(protect);
router.use(identifyTenantFromToken);
// Single permission check for all supplier order operations
router.use(hasPermission('supplier.portal_access'));

// Main supplier order routes
router.route('/')
  .get(getSupplierOrders)
  .post(createSupplierOrder);

router.route('/:id')
  .get(getSupplierOrder)
  .put(updateSupplierOrder)
  .delete(deleteSupplierOrder);

// Specialized routes for updating specific parts of an order
router.route('/:id/quote')
  .put(updateSupplierQuote);

router.route('/:id/po-details')
  .put(updatePODetails);

router.route('/:id/delivery')
  .put(updateDeliveryStatus);

router.route('/:id/status')
  .put(changeOrderStatus);

module.exports = router;
