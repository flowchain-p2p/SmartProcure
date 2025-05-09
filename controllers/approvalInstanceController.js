const ApprovalInstance = require('../models/ApprovalInstance');
const Requisition = require('../models/Requisition');
const mongoose = require('mongoose');

/**
 * Get all approval instances for a tenant
 * @route GET /api/approval-instances
 * @access Private
 */
exports.getApprovalInstances = async (req, res) => {
  try {
    const { tenantId } = req;
    const { status, requisitionId, page = 1, limit = 10 } = req.query;
    
    const query = { tenantId };
    
    // Add filters if provided
    if (status) {
      query.status = status;
    }
    
    if (requisitionId) {
      query.requisitionId = requisitionId;
    }
    
    // Count total documents
    const total = await ApprovalInstance.countDocuments(query);
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch approval instances with pagination
    const approvalInstances = await ApprovalInstance.find(query)
      .populate('approvals.approvers.userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      count: approvalInstances.length,
      total,
      data: approvalInstances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching approval instances:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Get a specific approval instance by ID
 * @route GET /api/approval-instances/:id
 * @access Private
 */
exports.getApprovalInstanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id) && !id.startsWith('approvalInstance-')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid approval instance ID format'
      });
    }
    
    // Prepare query - can search by MongoDB ID or instanceId
    const query = {
      tenantId,
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
        { instanceId: id }
      ]
    };
    
    // Find the approval instance
    const approvalInstance = await ApprovalInstance.findOne(query)
      .populate('approvals.approvers.userId', 'name email')
      .populate({
        path: 'requisitionId',
        select: 'requisitionNumber title status'
      });
    
    if (!approvalInstance) {
      return res.status(404).json({
        success: false,
        error: 'Approval instance not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: approvalInstance
    });
  } catch (error) {
    console.error('Error fetching approval instance:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Get approval instances by requisition ID
 * @route GET /api/approval-instances/requisition/:requisitionId
 * @access Private
 */
exports.getApprovalInstancesByRequisitionId = async (req, res) => {
  try {
    const { requisitionId } = req.params;
    const { tenantId } = req;
    
    // Validate requisition ID format
    if (!mongoose.Types.ObjectId.isValid(requisitionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid requisition ID format'
      });
    }
    
    // Find the approval instances for this requisition
    const approvalInstances = await ApprovalInstance.find({
      tenantId,
      requisitionId
    })
    .populate('approvals.approvers.userId', 'name email')
    .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: approvalInstances.length,
      data: approvalInstances
    });
  } catch (error) {
    console.error('Error fetching approval instances by requisition ID:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Get approval instances assigned to the current user
 * @route GET /api/approval-instances/my-approvals
 * @access Private
 */
exports.getMyApprovalInstances = async (req, res) => {
  try {
    const { userId, tenantId } = req;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build the query to find instances where the user is an approver in the current stage
    const query = {
      tenantId,
      'approvals.approvers.userId': userId
    };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Count total documents
    const total = await ApprovalInstance.countDocuments(query);
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch approval instances with pagination
    const approvalInstances = await ApprovalInstance.find(query)
      .populate('approvals.approvers.userId', 'name email')
      .populate({
        path: 'requisitionId',
        select: 'requisitionNumber title status createdAt'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Post-process to only include instances where the user is in the current stage
    const filteredInstances = approvalInstances.filter(instance => {
      const currentStage = instance.approvals[instance.currentStageIndex];
      return currentStage && currentStage.approvers.some(
        approver => approver.userId._id.toString() === userId &&
        approver.status === 'Pending'
      );
    });
    
    return res.status(200).json({
      success: true,
      count: filteredInstances.length,
      total: filteredInstances.length, // This is different from the total above
      data: filteredInstances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user approval instances:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Update an approval instance
 * @route PUT /api/approval-instances/:id
 * @access Private (Admin only)
 */
exports.updateApprovalInstance = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req;
    const updates = req.body;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id) && !id.startsWith('approvalInstance-')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid approval instance ID format'
      });
    }
    
    // Restrict certain fields from being updated directly
    const restrictedFields = ['_id', 'instanceId', 'requisitionId', 'tenantId', 'createdAt'];
    restrictedFields.forEach(field => {
      delete updates[field];
    });
    
    // Prepare query - can update by MongoDB ID or instanceId
    const query = {
      tenantId,
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
        { instanceId: id }
      ]
    };
    
    // Find and update the approval instance
    const approvalInstance = await ApprovalInstance.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('approvals.approvers.userId', 'name email');
    
    if (!approvalInstance) {
      return res.status(404).json({
        success: false,
        error: 'Approval instance not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: approvalInstance
    });
  } catch (error) {
    console.error('Error updating approval instance:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Get approval history for a requisition
 * @route GET /api/approval-instances/history/:requisitionId
 * @access Private
 */
exports.getApprovalHistory = async (req, res) => {
  try {
    const { requisitionId } = req.params;
    const { tenantId } = req;
    
    // Validate requisition ID format
    if (!mongoose.Types.ObjectId.isValid(requisitionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid requisition ID format'
      });
    }
    
    // Get the requisition
    const requisition = await Requisition.findOne({
      _id: requisitionId,
      tenantId
    });
    
    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }
    
    // Find the approval instance for this requisition
    const approvalInstance = await ApprovalInstance.findOne({
      requisitionId,
      tenantId
    }).populate('approvals.approvers.userId', 'name email');
    
    if (!approvalInstance) {
      return res.status(404).json({
        success: false,
        error: 'Approval instance not found'
      });
    }
    
    // Format the history
    const history = [];
    
    // Add submission event
    if (approvalInstance.startedAt) {
      history.push({
        action: 'Submitted',
        date: approvalInstance.startedAt,
        user: { name: 'System' },
        comments: 'Requisition submitted for approval'
      });
    }
    
    // Add approval/rejection events
    approvalInstance.approvals.forEach((stage) => {
      stage.approvers.forEach((approver) => {
        if (approver.status !== 'Pending' && approver.actionDate) {
          history.push({
            action: approver.status,
            date: approver.actionDate,
            user: {
              id: approver.userId._id,
              name: approver.userId.name,
              email: approver.userId.email,
              role: approver.role
            },
            stage: stage.stage,
            comments: approver.comments || ''
          });
        }
      });
    });
    
    // Sort history by date
    history.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error fetching approval history:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Delete an approval instance (admin only)
 * @route DELETE /api/approval-instances/:id
 * @access Private (Admin only)
 */
exports.deleteApprovalInstance = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id) && !id.startsWith('approvalInstance-')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid approval instance ID format'
      });
    }
    
    // Prepare query - can delete by MongoDB ID or instanceId
    const query = {
      tenantId,
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
        { instanceId: id }
      ]
    };
    
    // Find and delete the approval instance
    const approvalInstance = await ApprovalInstance.findOneAndDelete(query);
    
    if (!approvalInstance) {
      return res.status(404).json({
        success: false,
        error: 'Approval instance not found'
      });
    }
    
    // If there's a related requisition, update it
    if (approvalInstance.requisitionId) {
      await Requisition.findByIdAndUpdate(
        approvalInstance.requisitionId,
        { $unset: { approvalInstanceId: "" } }
      );
    }
    
    return res.status(200).json({
      success: true,
      message: 'Approval instance deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting approval instance:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
