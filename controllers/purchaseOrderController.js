const PurchaseOrder = require('../models/PurchaseOrder');
const Requisition = require('../models/Requisition');
const RFQ = require('../models/RFQ');
const Vendor = require('../models/Vendor');
const mongoose = require('mongoose');

/**
 * @desc    Get all purchase orders for the current tenant
 * @route   GET /api/v1/purchase-orders
 * @access  Private
 */
const getPurchaseOrders = async (req, res) => {
  try {
    const query = { tenantId: req.tenant.id };

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by vendorId if provided
    if (req.query.vendorId && mongoose.Types.ObjectId.isValid(req.query.vendorId)) {
      query.vendorId = req.query.vendorId;
    }

    // Filter by requisitionId if provided
    if (req.query.requisitionId && mongoose.Types.ObjectId.isValid(req.query.requisitionId)) {
      query.requisitionId = req.query.requisitionId;
    }

    // Filter by rfqId if provided
    if (req.query.rfqId && mongoose.Types.ObjectId.isValid(req.query.rfqId)) {
      query.rfqId = req.query.rfqId;
    }

    // Filter by organization if provided and valid
    if (req.query.organizationId && mongoose.Types.ObjectId.isValid(req.query.organizationId)) {
      query.organizationId = req.query.organizationId;
    }

    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { poNumber: searchRegex },
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await PurchaseOrder.countDocuments(query);
    
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('requisitionId', 'requisitionNumber title')
      .populate('vendorId', 'name code')
      .populate('rfqId', 'rfqNumber')
      .populate('createdBy', 'name email')
      .populate('issuedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: purchaseOrders.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: purchaseOrders
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders',
      error: error.message
    });
  }
};

/**
 * @desc    Get single purchase order by ID
 * @route   GET /api/v1/purchase-orders/:id
 * @access  Private
 */
const getPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    })
      .populate('requisitionId', 'requisitionNumber title')
      .populate('vendorId', 'name code contactPerson email phone address')
      .populate('rfqId', 'rfqNumber')
      .populate('createdBy', 'name email')
      .populate('issuedBy', 'name email');

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase order',
      error: error.message
    });
  }
};

/**
 * @desc    Create new purchase order
 * @route   POST /api/v1/purchase-orders
 * @access  Private
 */
const createPurchaseOrder = async (req, res) => {
  try {
    // Add tenant ID and created by user ID to the request body
    req.body.tenantId = req.tenant.id;
    req.body.createdBy = req.user.id;

    // Validate requisition exists and belongs to the same tenant
    const requisition = await Requisition.findOne({
      _id: req.body.requisitionId,
      tenantId: req.tenant.id
    });

    if (!requisition) {
      return res.status(404).json({
        success: false,
        message: 'Associated requisition not found'
      });
    }

    // Validate vendor exists and belongs to the same tenant
    const vendor = await Vendor.findOne({
      _id: req.body.vendorId,
      tenantId: req.tenant.id
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Associated vendor not found'
      });
    }

    // If rfqId is provided, validate it exists and belongs to the same tenant
    if (req.body.rfqId) {
      const rfq = await RFQ.findOne({
        _id: req.body.rfqId,
        tenantId: req.tenant.id
      });

      if (!rfq) {
        return res.status(404).json({
          success: false,
          message: 'Associated RFQ not found'
        });
      }
    }
    
    // Generate a unique PO number (you can customize this format)
    const poCount = await PurchaseOrder.countDocuments({ tenantId: req.tenant.id });
    req.body.poNumber = `PO-${req.tenant.code}-${new Date().getFullYear()}-${(poCount + 1).toString().padStart(4, '0')}`;

    // Calculate total amount from items
    if (req.body.items && req.body.items.length > 0) {
      req.body.totalAmount = req.body.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }

    const purchaseOrder = await PurchaseOrder.create(req.body);

    res.status(201).json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message
    });
  }
};

/**
 * @desc    Update purchase order
 * @route   PUT /api/v1/purchase-orders/:id
 * @access  Private
 */
const updatePurchaseOrder = async (req, res) => {
  try {
    // Find purchase order and verify it belongs to the tenant
    let purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Don't allow changing some fields after creation
    delete req.body.poNumber;
    delete req.body.tenantId;
    delete req.body.createdBy;
    delete req.body.createdAt;

    // Calculate total amount from items if items are provided
    if (req.body.items && req.body.items.length > 0) {
      req.body.totalAmount = req.body.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
    
    // Update the updatedAt timestamp
    req.body.updatedAt = Date.now();

    // Update the purchase order
    purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase order',
      error: error.message
    });
  }
};

/**
 * @desc    Delete purchase order
 * @route   DELETE /api/v1/purchase-orders/:id
 * @access  Private
 */
const deletePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Only allow deletion of purchase orders in Draft status
    if (purchaseOrder.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft purchase orders can be deleted'
      });
    }

    await PurchaseOrder.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete purchase order',
      error: error.message
    });
  }
};

/**
 * @desc    Update purchase order status to Issued
 * @route   PATCH /api/v1/purchase-orders/:id/issue
 * @access  Private
 */
const issuePurchaseOrder = async (req, res) => {
  try {
    let purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft purchase orders can be issued'
      });
    }

    // Update the purchase order status
    purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Issued',
        issuedBy: req.user.id,
        issuedAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error issuing purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to issue purchase order',
      error: error.message
    });
  }
};

/**
 * @desc    Update purchase order status to Delivered
 * @route   PATCH /api/v1/purchase-orders/:id/deliver
 * @access  Private
 */
const markPurchaseOrderDelivered = async (req, res) => {
  try {
    let purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.status !== 'Issued') {
      return res.status(400).json({
        success: false,
        message: 'Only issued purchase orders can be marked as delivered'
      });
    }

    // Update the purchase order status
    purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Delivered',
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error marking purchase order as delivered:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark purchase order as delivered',
      error: error.message
    });
  }
};

/**
 * @desc    Update purchase order status to Completed
 * @route   PATCH /api/v1/purchase-orders/:id/complete
 * @access  Private
 */
const completePurchaseOrder = async (req, res) => {
  try {
    let purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Only delivered purchase orders can be completed'
      });
    }

    // Update the purchase order status
    purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Completed',
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error completing purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete purchase order',
      error: error.message
    });
  }
};

/**
 * @desc    Update purchase order status to Cancelled
 * @route   PATCH /api/v1/purchase-orders/:id/cancel
 * @access  Private
 */
const cancelPurchaseOrder = async (req, res) => {
  try {
    let purchaseOrder = await PurchaseOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Only allow cancellation if not completed
    if (purchaseOrder.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed purchase orders cannot be cancelled'
      });
    }

    // Update the purchase order status
    purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Cancelled',
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error cancelling purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel purchase order',
      error: error.message
    });
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  issuePurchaseOrder,
  markPurchaseOrderDelivered,
  completePurchaseOrder,
  cancelPurchaseOrder
};
