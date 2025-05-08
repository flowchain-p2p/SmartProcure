const mongoose = require('mongoose');
const SupplierOrder = require('../models/SupplierOrder');
const Vendor = require('../models/Vendor');

// @desc    Get all supplier orders for a tenant
// @route   GET /api/v1/supplier-orders
// @access  Private
const getSupplierOrders = async (req, res) => {
  try {
    // Add filtering options
    const filter = { tenantId: req.tenant._id };
    
    // Check for vendorId filter
    if (req.query.vendorId) {
      filter.vendorId = req.query.vendorId;
    }
    
    // Check for status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Check for orderType filter
    if (req.query.orderType) {
      filter.orderType = req.query.orderType;
    }

    // Pagination setup
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Query with pagination
    const orders = await SupplierOrder.find(filter)
      .populate('vendorId', 'name code contactPerson email phone')
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(limit)
      .skip(startIndex);

    // Get total count
    const total = await SupplierOrder.countDocuments(filter);

    // Prepare pagination info
    const pagination = {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit
    };

    res.status(200).json({
      success: true,
      count: orders.length,
      pagination,
      data: orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single supplier order
// @route   GET /api/v1/supplier-orders/:id
// @access  Private
const getSupplierOrder = async (req, res) => {
  try {
    const order = await SupplierOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    }).populate('vendorId', 'name code contactPerson email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Supplier order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new supplier order
// @route   POST /api/v1/supplier-orders
// @access  Private
const createSupplierOrder = async (req, res) => {
  try {
    // Add tenant ID to the order
    req.body.tenantId = req.tenant._id;
    
    // Add creator info if available
    if (req.user && req.user._id) {
      req.body.createdBy = req.user._id;
    }

    // Verify that vendor exists and belongs to this tenant
    const vendor = await Vendor.findOne({ 
      _id: req.body.vendorId,
      tenantId: req.tenant._id
    });

    if (!vendor) {
      return res.status(400).json({
        success: false,
        error: 'Vendor not found or does not belong to this tenant'
      });
    }

    // Create order
    const order = await SupplierOrder.create(req.body);

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update supplier order
// @route   PUT /api/v1/supplier-orders/:id
// @access  Private
const updateSupplierOrder = async (req, res) => {
  try {
    // Find order and verify ownership
    let order = await SupplierOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Supplier order not found'
      });
    }

    // If vendor ID is being changed, verify new vendor exists and belongs to this tenant
    if (req.body.vendorId && req.body.vendorId.toString() !== order.vendorId.toString()) {
      const vendor = await Vendor.findOne({ 
        _id: req.body.vendorId,
        tenantId: req.tenant._id
      });

      if (!vendor) {
        return res.status(400).json({
          success: false,
          error: 'Vendor not found or does not belong to this tenant'
        });
      }
    }

    // Update the order
    order = await SupplierOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // Return the updated document
        runValidators: true // Run model validators
      }
    );

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete supplier order
// @route   DELETE /api/v1/supplier-orders/:id
// @access  Private
const deleteSupplierOrder = async (req, res) => {
  try {
    // Find order and verify ownership
    const order = await SupplierOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Supplier order not found'
      });
    }

    await SupplierOrder.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update supplier quote
// @route   PUT /api/v1/supplier-orders/:id/quote
// @access  Private
const updateSupplierQuote = async (req, res) => {
  try {
    // Find order and verify ownership
    let order = await SupplierOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Supplier order not found'
      });
    }

    // Update the quote part of the order
    const updatedQuote = {
      ...order.quote,
      ...req.body,
      submittedAt: new Date()
    };

    order = await SupplierOrder.findByIdAndUpdate(
      req.params.id,
      { quote: updatedQuote },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update PO Details
// @route   PUT /api/v1/supplier-orders/:id/po-details
// @access  Private
const updatePODetails = async (req, res) => {
  try {
    // Find order and verify ownership
    let order = await SupplierOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Supplier order not found'
      });
    }

    // Update the PO details part of the order
    const updatedPODetails = {
      ...order.poDetails,
      ...req.body
    };

    order = await SupplierOrder.findByIdAndUpdate(
      req.params.id,
      { poDetails: updatedPODetails },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update delivery status
// @route   PUT /api/v1/supplier-orders/:id/delivery
// @access  Private
const updateDeliveryStatus = async (req, res) => {
  try {
    // Find order and verify ownership
    let order = await SupplierOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Supplier order not found'
      });
    }

    // Update the delivery status part of the order
    const updatedDeliveryStatus = {
      ...order.deliveryStatus,
      ...req.body,
      updatedAt: new Date()
    };

    order = await SupplierOrder.findByIdAndUpdate(
      req.params.id,
      { 
        deliveryStatus: updatedDeliveryStatus,
        // If delivery status is "Delivered", also update the main status
        ...(req.body.currentStatus === 'Delivered' ? { status: 'Delivered' } : {})
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Change order status
// @route   PUT /api/v1/supplier-orders/:id/status
// @access  Private
const changeOrderStatus = async (req, res) => {
  try {
    // Check if status is provided
    if (!req.body.status) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a status'
      });
    }

    // Find order and verify ownership
    let order = await SupplierOrder.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Supplier order not found'
      });
    }

    // Update the status
    order = await SupplierOrder.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = {
  getSupplierOrders,
  getSupplierOrder,
  createSupplierOrder,
  updateSupplierOrder,
  deleteSupplierOrder,
  updateSupplierQuote,
  updatePODetails,
  updateDeliveryStatus,
  changeOrderStatus
};
