const { validationResult } = require('express-validator');
const supplierInviteService = require('../services/supplierInviteService');
const SupplierInvite = require('../models/SupplierInvite');

/**
 * @desc    Send an invitation to a supplier
 * @route   POST /api/v1/suppliers/invite
 * @access  Private
 */
exports.inviteSupplier = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, phone } = req.body;
    
    // Check if an active invitation already exists
    const existingInvite = await SupplierInvite.findOne({
      email,
      tenantId: req.tenant._id,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvite) {
      return res.status(400).json({
        success: false,
        message: 'An active invitation already exists for this email'
      });
    }

    // Send invitation
    const result = await supplierInviteService.inviteSupplier(
      { email, phone },
      { tenant: req.tenant, user: req.user }
    );

    res.status(200).json({
      success: true,
      data: result.invite
    });
  } catch (error) {
    console.error('Error inviting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while inviting supplier',
      error: error.message
    });
  }
};

/**
 * @desc    Get all supplier invitations for a tenant
 * @route   GET /api/v1/suppliers/invites
 * @access  Private
 */
exports.getInvites = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { tenantId: req.tenant._id };
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Search by email
    if (req.query.email) {
      query.email = { $regex: req.query.email, $options: 'i' };
    }

    // Execute query with pagination
    const invites = await SupplierInvite.find(query)
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const total = await SupplierInvite.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: invites.length,
      total,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit)
      },
      data: invites
    });
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching invites',
      error: error.message
    });
  }
};

/**
 * @desc    Verify an invitation token
 * @route   GET /api/v1/suppliers/verify-invite/:token
 * @access  Public
 */
exports.verifyInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const tenantId = req.query.tenantId;
    
    if (!token || !tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Token and tenant ID are required'
      });
    }
    
    const result = await supplierInviteService.verifyInvite(token, tenantId);
    
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.invite
    });
  } catch (error) {
    console.error('Error verifying invite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying invite',
      error: error.message
    });
  }
};

/**
 * @desc    Resend an invitation email
 * @route   POST /api/v1/suppliers/invites/:id/resend
 * @access  Private
 */
exports.resendInvite = async (req, res) => {
  try {
    const invite = await SupplierInvite.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });
    
    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    // Update expiry date to extend by 7 more days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    invite.expiresAt = expiresAt;
    invite.status = 'pending';
    
    // Save the updated invite
    await invite.save();
    
    // Resend invitation
    const result = await supplierInviteService.inviteSupplier(
      { email: invite.email, phone: invite.phone },
      { tenant: req.tenant, user: req.user }
    );
    
    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully',
      data: result.invite
    });
  } catch (error) {
    console.error('Error resending invite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending invite',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel an invitation
 * @route   DELETE /api/v1/suppliers/invites/:id
 * @access  Private
 */
exports.cancelInvite = async (req, res) => {
  try {
    const invite = await SupplierInvite.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenant._id },
      { status: 'cancelled' },
      { new: true }
    );
    
    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully',
      data: invite
    });
  } catch (error) {
    console.error('Error cancelling invite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling invite',
      error: error.message
    });
  }
};
