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

// Main supplier order routes
router.route('/')
  .get(hasPermission('supplier.view'), getSupplierOrders)
  .post(hasPermission('supplier.create'), createSupplierOrder);

router.route('/:id')
  .get(hasPermission('supplier.view'), getSupplierOrder)
  .put(hasPermission('supplier.edit'), updateSupplierOrder)
  .delete(hasPermission('supplier.delete'), deleteSupplierOrder);

// Specialized routes for updating specific parts of an order
router.route('/:id/quote')
  .put(hasPermission('supplier.edit'), updateSupplierQuote);

router.route('/:id/po-details')
  .put(hasPermission('supplier.edit'), updatePODetails);

router.route('/:id/delivery')
  .put(hasPermission('supplier.edit'), updateDeliveryStatus);

router.route('/:id/status')
  .put(hasPermission('supplier.edit'), changeOrderStatus);

module.exports = router;
