const RFQ = require('../models/RFQ');
const Requisition = require('../models/Requisition');
const Vendor = require('../models/Vendor');
const mongoose = require('mongoose');

/**
 * @desc    Get all RFQs for the current tenant
 * @route   GET /api/v1/rfqs
 * @access  Private
 */
const getRFQs = async (req, res) => {
  try {
    const query = { tenantId: req.tenant.id };

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by requisitionId if provided
    if (req.query.requisitionId && mongoose.Types.ObjectId.isValid(req.query.requisitionId)) {
      query.requisitionId = req.query.requisitionId;
    }

    // Filter by awardedVendorId if provided
    if (req.query.awardedVendorId && mongoose.Types.ObjectId.isValid(req.query.awardedVendorId)) {
      query.awardedVendorId = req.query.awardedVendorId;
    }

    // Filter by vendor if provided
    if (req.query.vendorId && mongoose.Types.ObjectId.isValid(req.query.vendorId)) {
      query['vendorQuotes.vendorId'] = req.query.vendorId;
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
        { rfqNumber: searchRegex },
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await RFQ.countDocuments(query);
    
    const rfqs = await RFQ.find(query)
      .populate('requisitionId', 'requisitionNumber title')
      .populate('awardedVendorId', 'name code')
      .populate('createdBy', 'name email')
      .populate('openedBy', 'name email')
      .populate('awardedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: rfqs.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: rfqs
    });
  } catch (error) {
    console.error('Error fetching RFQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch RFQs',
      error: error.message
    });
  }
};

/**
 * @desc    Get single RFQ by ID
 * @route   GET /api/v1/rfqs/:id
 * @access  Private
 */
const getRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    })
      .populate('requisitionId', 'requisitionNumber title')
      .populate('awardedVendorId', 'name code contactPerson email phone address')
      .populate('createdBy', 'name email')
      .populate('openedBy', 'name email')
      .populate('awardedBy', 'name email')
      .populate('vendorQuotes.vendorId', 'name code contactPerson email phone');

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'RFQ not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rfq
    });
  } catch (error) {
    console.error('Error fetching RFQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch RFQ',
      error: error.message
    });
  }
};

/**
 * @desc    Create new RFQ
 * @route   POST /api/v1/rfqs
 * @access  Private
 */
const createRFQ = async (req, res) => {
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

    // Validate vendors if provided
    if (req.body.vendorQuotes && req.body.vendorQuotes.length > 0) {
      const vendorIds = req.body.vendorQuotes.map(vq => vq.vendorId);
      const vendors = await Vendor.find({
        _id: { $in: vendorIds },
        tenantId: req.tenant.id
      });

      if (vendors.length !== vendorIds.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more vendors not found or do not belong to this tenant'
        });
      }
    }
    
    // Generate a unique RFQ number (you can customize this format)
    const rfqCount = await RFQ.countDocuments({ tenantId: req.tenant.id });
    req.body.rfqNumber = `RFQ-${req.tenant.code}-${new Date().getFullYear()}-${(rfqCount + 1).toString().padStart(4, '0')}`;

    // Calculate estimated total amount if items are provided
    if (req.body.items && req.body.items.length > 0) {
      req.body.estimatedTotalAmount = req.body.items.reduce((sum, item) => {
        return sum + (item.estimatedUnitPrice || 0) * item.quantity;
      }, 0);
    }

    const rfq = await RFQ.create(req.body);

    res.status(201).json({
      success: true,
      data: rfq
    });
  } catch (error) {
    console.error('Error creating RFQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create RFQ',
      error: error.message
    });
  }
};

/**
 * @desc    Update RFQ
 * @route   PUT /api/v1/rfqs/:id
 * @access  Private
 */
const updateRFQ = async (req, res) => {
  try {
    // Find RFQ and verify it belongs to the tenant
    let rfq = await RFQ.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'RFQ not found'
      });
    }

    // Don't allow changing some fields after creation
    delete req.body.rfqNumber;
    delete req.body.tenantId;
    delete req.body.createdBy;
    delete req.body.createdAt;

    // Calculate estimated total amount from items if items are provided
    if (req.body.items && req.body.items.length > 0) {
      req.body.estimatedTotalAmount = req.body.items.reduce((sum, item) => {
        return sum + (item.estimatedUnitPrice || 0) * item.quantity;
      }, 0);
    }
    
    // Update the updatedAt timestamp
    req.body.updatedAt = Date.now();

    // Update the RFQ
    rfq = await RFQ.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: rfq
    });
  } catch (error) {
    console.error('Error updating RFQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update RFQ',
      error: error.message
    });
  }
};

/**
 * @desc    Delete RFQ
 * @route   DELETE /api/v1/rfqs/:id
 * @access  Private
 */
const deleteRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'RFQ not found'
      });
    }

    // Only allow deletion of RFQs in Draft status
    if (rfq.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft RFQs can be deleted'
      });
    }

    await RFQ.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'RFQ deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting RFQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete RFQ',
      error: error.message
    });
  }
};

/**
 * @desc    Issue an RFQ (change status from Draft to Issued)
 * @route   PATCH /api/v1/rfqs/:id/issue
 * @access  Private
 */
const issueRFQ = async (req, res) => {
  try {
    let rfq = await RFQ.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'RFQ not found'
      });
    }

    if (rfq.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft RFQs can be issued'
      });
    }

    // Ensure RFQ has at least one invited vendor
    if (!rfq.vendorQuotes || rfq.vendorQuotes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'RFQ must have at least one vendor invited before issuance'
      });
    }

    // Update the RFQ status
    rfq = await RFQ.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Issued',
        openedBy: req.user.id,
        openedAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: rfq
    });
  } catch (error) {
    console.error('Error issuing RFQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to issue RFQ',
      error: error.message
    });
  }
};

/**
 * @desc    Mark an RFQ as delivered
 * @route   PATCH /api/v1/rfqs/:id/deliver
 * @access  Private
 */
const markRFQDelivered = async (req, res) => {
  try {
    let rfq = await RFQ.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'RFQ not found'
      });
    }

    if (rfq.status !== 'Issued') {
      return res.status(400).json({
        success: false,
        message: 'Only issued RFQs can be marked as delivered'
      });
    }

    // Update the RFQ status
    rfq = await RFQ.findByIdAndUpdate(
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
      data: rfq
    });
  } catch (error) {
    console.error('Error marking RFQ as delivered:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark RFQ as delivered',
      error: error.message
    });
  }
};

/**
 * @desc    Complete an RFQ (change status from Delivered to Completed)
 * @route   PATCH /api/v1/rfqs/:id/complete
 * @access  Private
 */
const completeRFQ = async (req, res) => {
  try {
    let rfq = await RFQ.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'RFQ not found'
      });
    }

    if (rfq.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Only delivered RFQs can be completed'
      });
    }

    // Update the RFQ status
    rfq = await RFQ.findByIdAndUpdate(
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
      data: rfq
    });
  } catch (error) {
    console.error('Error completing RFQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete RFQ',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel an RFQ
 * @route   PATCH /api/v1/rfqs/:id/cancel
 * @access  Private
 */
const cancelRFQ = async (req, res) => {
  try {
    let rfq = await RFQ.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'RFQ not found'
      });
    }

    // Only allow cancellation if not completed
    if (rfq.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed RFQs cannot be cancelled'
      });
    }

    // Update the RFQ status
    rfq = await RFQ.findByIdAndUpdate(
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
      data: rfq
    });
  } catch (error) {
    console.error('Error cancelling RFQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel RFQ',
      error: error.message
    });
  }
};

/**
 * @desc    Add vendor quote to RFQ
 * @route   POST /api/v1/rfqs/:id/vendors
 * @access  Private
 */
const addVendorToRFQ = async (req, res) => {
  try {
    // Find RFQ and verify it belongs to the tenant
    let rfq = await RFQ.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'RFQ not found'
      });
    }

    // Validate vendor exists and belongs to the tenant
    const vendor = await Vendor.findOne({
      _id: req.body.vendorId,
      tenantId: req.tenant.id
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if vendor already exists in the RFQ
    const vendorExists = rfq.vendorQuotes.some(vq => vq.vendorId.toString() === req.body.vendorId);
    if (vendorExists) {
      return res.status(400).json({
        success: false,
        message: 'Vendor already invited to this RFQ'
      });
    }

    // Add vendor to the RFQ
    rfq.vendorQuotes.push({
      vendorId: req.body.vendorId,
      invitedAt: Date.now(),
      status: 'Invited'
    });

    rfq.updatedAt = Date.now();
    await rfq.save();

    res.status(200).json({
      success: true,
      data: rfq
    });
  } catch (error) {
    console.error('Error adding vendor to RFQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add vendor to RFQ',
      error: error.message
    });
  }
};

/**
 * @desc    Update vendor quote in RFQ
 * @route   PUT /api/v1/rfqs/:id/vendors/:vendorId
 * @access  Private
 */
const updateVendorQuote = async (req, res) => {
  try {
    // Find RFQ and verify it belongs to the tenant
    let rfq = await RFQ.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id,
      'vendorQuotes.vendorId': req.params.vendorId
    });

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'RFQ or vendor quote not found'
      });
    }

    // Get vendor quote index
    const vendorQuoteIndex = rfq.vendorQuotes.findIndex(
      vq => vq.vendorId.toString() === req.params.vendorId
    );

    // Update only allowed fields
    if (req.body.status) rfq.vendorQuotes[vendorQuoteIndex].status = req.body.status;
    if (req.body.totalQuoteAmount) rfq.vendorQuotes[vendorQuoteIndex].totalQuoteAmount = req.body.totalQuoteAmount;
    if (req.body.currency) rfq.vendorQuotes[vendorQuoteIndex].currency = req.body.currency;
    if (req.body.deliveryDate) rfq.vendorQuotes[vendorQuoteIndex].deliveryDate = req.body.deliveryDate;
    if (req.body.notes) rfq.vendorQuotes[vendorQuoteIndex].notes = req.body.notes;
    if (req.body.attachments) rfq.vendorQuotes[vendorQuoteIndex].attachments = req.body.attachments;
    
    // Update response timestamps
    if (req.body.status === 'Responded' && !rfq.vendorQuotes[vendorQuoteIndex].responsedAt) {
      rfq.vendorQuotes[vendorQuoteIndex].responsedAt = Date.now();
      rfq.vendorQuotes[vendorQuoteIndex].quoteSubmittedAt = Date.now();
    }

    // Update item quotes if provided
    if (req.body.itemQuotes && Array.isArray(req.body.itemQuotes)) {
      rfq.vendorQuotes[vendorQuoteIndex].itemQuotes = req.body.itemQuotes;
    }

    rfq.updatedAt = Date.now();
    await rfq.save();

    res.status(200).json({
      success: true,
      data: rfq.vendorQuotes[vendorQuoteIndex]
    });
  } catch (error) {
    console.error('Error updating vendor quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor quote',
      error: error.message
    });
  }
};

/**
 * @desc    Award RFQ to a vendor
 * @route   PATCH /api/v1/rfqs/:id/award/:vendorId
 * @access  Private
 */
const awardRFQ = async (req, res) => {
  try {
    // Find RFQ and verify it belongs to the tenant
    let rfq = await RFQ.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id,
      'vendorQuotes.vendorId': req.params.vendorId
    });

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'RFQ or vendor not found'
      });
    }

    if (rfq.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Only delivered RFQs can be awarded'
      });
    }

    // Update vendor quote status
    const vendorQuoteIndex = rfq.vendorQuotes.findIndex(
      vq => vq.vendorId.toString() === req.params.vendorId
    );

    rfq.vendorQuotes[vendorQuoteIndex].status = 'Selected';

    // Award RFQ to the vendor
    rfq.awardedVendorId = req.params.vendorId;
    rfq.awardedBy = req.user.id;
    rfq.awardedAt = Date.now();
    rfq.status = 'Completed';
    rfq.updatedAt = Date.now();

    await rfq.save();

    res.status(200).json({
      success: true,
      data: rfq
    });
  } catch (error) {
    console.error('Error awarding RFQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award RFQ',
      error: error.message
    });
  }
};

module.exports = {
  getRFQs,
  getRFQ,
  createRFQ,
  updateRFQ,
  deleteRFQ,
  issueRFQ,
  markRFQDelivered,
  completeRFQ,
  cancelRFQ,
  addVendorToRFQ,
  updateVendorQuote,
  awardRFQ
};
