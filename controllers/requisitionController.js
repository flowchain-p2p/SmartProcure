const Requisition = require('../models/Requisition');
const RequisitionItem = require('../models/RequisitionItem');
const ApprovalHistory = require('../models/ApprovalHistory');
const CostCenter = require('../models/CostCenter');
const User = require('../models/User');
const mongoose = require('mongoose');
const Location = require('../models/Location');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');

/**
 * @desc    Get all requisitions for the current tenant
 * @route   GET /api/v1/requisitions
 * @access  Private
 */
const getRequisitions = async (req, res) => {
  try {
    const query = { tenantId: req.tenant.id };

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by createdBy if provided
    if (req.query.createdBy) {
      query.createdBy = req.query.createdBy;
    }    // Filter by organization if provided and valid
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
        { requisitionNumber: searchRegex },
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Execute query with pagination
    const requisitions = await Requisition.find(query)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count
    const total = await Requisition.countDocuments(query);

    res.status(200).json({
      success: true,
      count: requisitions.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: requisitions
    });
  } catch (error) {
    console.error('Error fetching requisitions:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching requisitions'
    });
  }
};

/**
 * @desc    Get a single requisition by ID with its items
 * @route   GET /api/v1/requisitions/:id
 * @access  Private
 */
const getRequisition = async (req, res) => {
  try {
    const requisition = await Requisition.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('organizationId', 'name');

    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }

    // Get the requisition items
    const items = await RequisitionItem.find({
      requisitionId: requisition._id,
      tenantId: req.tenant.id
    }).populate('catalogProductId').populate('unitId');

    // Return the requisition with its items
    res.status(200).json({
      success: true,
      data: {
        ...requisition.toObject(),
        items
      }
    });
  } catch (error) {
    console.error('Error fetching requisition:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching requisition'
    });
  }
};

/**
 * @desc    Create a new requisition
 * @route   POST /api/v1/requisitions
 * @access  Private
 */
const createRequisition = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { title, description, organizationId, costCenterId, items, ...rest } = req.body;

    // Generate a unique requisition number
    const count = await Requisition.countDocuments({ tenantId: req.tenant.id });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const requisitionNumber = `PR-${req.tenant.id.toString().slice(-4)}-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

    // Create the requisition with optional organizationId - only include if it's a valid ObjectId
    const requisitionData = {
      requisitionNumber,
      title,
      description,
      tenantId: req.tenant.id,
      createdBy: req.user.id,
      ...rest
    };
    
    // Only add organizationId if it's a valid MongoDB ObjectId
    if (organizationId && mongoose.Types.ObjectId.isValid(organizationId)) {
      requisitionData.organizationId = organizationId;
    }

    // Only add costCenterId if it's a valid MongoDB ObjectId
    if (costCenterId && mongoose.Types.ObjectId.isValid(costCenterId)) {
      requisitionData.costCenterId = costCenterId;
    }

    const requisition = await Requisition.create(requisitionData);

    // Create requisition items if provided
    let savedItems = [];
    if (items && items.length > 0) {
      const itemsToCreate = items.map(item => ({
        ...item,
        requisitionId: requisition._id,
        tenantId: req.tenant.id
      }));

      savedItems = await RequisitionItem.create(itemsToCreate);
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: {
        ...requisition.toObject(),
        items: savedItems
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Error creating requisition:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Update a requisition
 * @route   PUT /api/v1/requisitions/:id
 * @access  Private
 */
const updateRequisition = async (req, res) => {
  try {
    let requisition = await Requisition.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }

    // Check if user is authorized to update
    if (requisition.status !== 'Draft' && !['admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this requisition'
      });
    }    // Prepare update data
    const updateData = { 
      updatedBy: req.user.id,
      updatedAt: Date.now() 
    };
    
    // Add all fields from request body except organizationId
    Object.keys(req.body).forEach(key => {
      if (key !== 'organizationId') {
        updateData[key] = req.body[key];
      }
    });
    
    // Only add organizationId if it's a valid ObjectId
    if (req.body.organizationId && mongoose.Types.ObjectId.isValid(req.body.organizationId)) {
      updateData.organizationId = req.body.organizationId;
    }
    
    // Update the requisition
    requisition = await Requisition.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: requisition
    });
  } catch (error) {
    console.error('Error updating requisition:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Delete a requisition
 * @route   DELETE /api/v1/requisitions/:id
 * @access  Private
 */
const deleteRequisition = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const requisition = await Requisition.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }

    // Check if user is authorized to delete
    if (requisition.status !== 'Draft' && !['admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this requisition'
      });
    }

    // Delete all items first
    await RequisitionItem.deleteMany({
      requisitionId: req.params.id,
      tenantId: req.tenant.id
    });

    // Delete the requisition
    await Requisition.findByIdAndDelete(req.params.id);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Error deleting requisition:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting requisition'
    });
  }
};

/**
 * @desc    Submit a requisition for approval
 * @route   PUT /api/v1/requisitions/:id/submit
 * @access  Private
 */
const submitRequisition = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    let requisition = await Requisition.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }

    // Check if user is authorized to submit
    if (requisition.createdBy.toString() !== req.user.id && !['Administrator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to submit this requisition'
      });
    }

    // Check if requisition is in Draft status
    if (requisition.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        error: 'Only draft requisitions can be submitted'
      });
    }

    // Check if requisition has items
    const itemCount = await RequisitionItem.countDocuments({
      requisitionId: requisition._id,
      tenantId: req.tenant.id
    });

    if (itemCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot submit a requisition without items'
      });
    }
      // Check if frontend provided the necessary approval data
    const { costCenterHeadId, currentApprover, approvalStage, approverRole } = req.body;
    
    // Variable to hold the approver information
    let approverInfo = {};
    
    // If frontend didn't provide approval data, query it from the database
    if (!costCenterHeadId && !currentApprover) {
      // Legacy flow - fetch from database
      
      // Get cost center for approval routing
      const costCenter = await CostCenter.findById(requisition.costCenterId);
      if (!costCenter) {
        return res.status(400).json({
          success: false,
          error: 'Cost center not found'
        });
      }

      // Check if cost center has a head assigned
      if (!costCenter.head) {
        return res.status(400).json({
          success: false,
          error: 'Cost center has no designated head for approval'
        });
      }

      // Find the cost center head user
      const costCenterHead = await User.findById(costCenter.head);
      if (!costCenterHead) {
        return res.status(400).json({
          success: false,
          error: 'Cost center head user not found'
        });
      }

      // Get user's default location for ship to
      const requestor = await User.findById(req.user.id).populate('defaultLocationId');
      if (!requestor.defaultLocationId) {
        return res.status(400).json({
          success: false,
          error: 'User has no default location set for shipping'
        });
      }
      
      // Set approver info from database
      approverInfo = {
        currentApprover: costCenterHead._id,
        approvalStage: 'Cost Center',
        approverRole: 'CostCenterHead'
      };
    } else {
      // New flow - use frontend provided data
      approverInfo = {
        currentApprover: currentApprover || costCenterHeadId, // Support both parameter names
        approvalStage: approvalStage || 'Cost Center',
        approverRole: approverRole || 'CostCenterHead'
      };
    }

    // Update the requisition status and set the current approver
    requisition = await Requisition.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Pending Cost Center Approval',
        submittedAt: Date.now(),
        currentApprover: approverInfo.currentApprover,
        approvalStage: approverInfo.approvalStage,
        approverRole: approverInfo.approverRole,
        updatedAt: Date.now()
      },
      { new: true }
    );

    // Create approval history record
    await ApprovalHistory.create({
      requisitionId: requisition._id,
      actionType: 'Submitted',
      actionBy: req.user.id,
      statusFrom: 'Draft',
      statusTo: 'Pending Cost Center Approval',
      comments: req.body.comments || 'Submitted for approval',
      tenantId: req.tenant.id
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: requisition
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error submitting requisition:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while submitting requisition'
    });
  }
};

/**
 * @desc    Approve or reject a requisition
 * @route   PUT /api/v1/requisitions/:id/approve
 * @access  Private/Permission Based
 */
const approveRequisition = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { decision, comments } = req.body;

    if (!['approve', 'reject', 'return'].includes(decision.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Decision must be either approve, reject, or return'
      });
    }

    let requisition = await Requisition.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }

    // Check if requisition is pending approval
    if (!requisition.status.startsWith('Pending')) {
      return res.status(400).json({
        success: false,
        error: 'This requisition is not pending approval'
      });
    }

    // Check if user is the current approver
    if (requisition.currentApprover.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You are not the current approver for this requisition'
      });
    }

    // Setup for workflow progression
    const currentStatus = requisition.status;
    let newStatus, nextApprover = null, newApprovalStage = requisition.approvalStage, newApproverRole = '';
    const actionType = decision.charAt(0).toUpperCase() + decision.slice(1);  // Capitalize first letter

    // Handle approval decision logic
    if (decision.toLowerCase() === 'approve') {
      // Check if we need to progress to next approval stage
      if (requisition.approvalStage === 'Cost Center') {
        // Move to Department stage if needed
        newStatus = 'Pending Department Approval';
        newApprovalStage = 'Department';
        newApproverRole = 'Department Head';
        
        // Find department head from user's department
        const requestor = await User.findById(requisition.createdBy).populate('departmentId');
        if (requestor && requestor.departmentId && requestor.departmentId.head) {
          nextApprover = requestor.departmentId.head;
        } else {
          // Skip to Finance approval if no department head
          newStatus = 'Pending Finance Approval';
          newApprovalStage = 'Finance';
          newApproverRole = 'Finance';
          
          // Find a finance approver
          const financeUsers = await User.find({ 
            roles: { $in: ['Finance'] },
            tenantId: req.tenant.id,
            active: true
          }).sort({ approvalHierarchy: -1 }).limit(1);
          
          if (financeUsers && financeUsers.length > 0) {
            nextApprover = financeUsers[0]._id;
          } else {
            // If no finance approver, final approval
            newStatus = 'Approved';
            newApprovalStage = 'Complete';
          }
        }
      } else if (requisition.approvalStage === 'Department') {
        // Move to Finance stage
        newStatus = 'Pending Finance Approval';
        newApprovalStage = 'Finance';
        newApproverRole = 'Finance';
        
        // Find a finance approver
        const financeUsers = await User.find({ 
          roles: { $in: ['Finance'] },
          tenantId: req.tenant.id,
          active: true
        }).sort({ approvalHierarchy: -1 }).limit(1);
        
        if (financeUsers && financeUsers.length > 0) {
          nextApprover = financeUsers[0]._id;
        } else {
          // If no finance approver, final approval
          newStatus = 'Approved';
          newApprovalStage = 'Complete';
        }
      } else if (requisition.approvalStage === 'Finance') {
        // Final approval
        newStatus = 'Approved';
        newApprovalStage = 'Complete';
      }
    } else if (decision.toLowerCase() === 'reject') {
      // Rejection is final
      newStatus = 'Rejected';
      newApprovalStage = 'Complete';
    } else if (decision.toLowerCase() === 'return') {
      // Return to requester for changes
      newStatus = 'Returned';
      newApprovalStage = 'Not Started';
    }

    // Update the requisition
    requisition = await Requisition.findByIdAndUpdate(
      req.params.id,
      {
        status: newStatus,
        currentApprover: nextApprover,
        approvalStage: newApprovalStage,
        approverRole: newApproverRole,
        updatedAt: Date.now(),
        approvedBy: newStatus === 'Approved' ? req.user.id : requisition.approvedBy
      },
      { new: true }
    );

    // Create approval history entry
    await ApprovalHistory.create({
      requisitionId: requisition._id,
      actionType: actionType,
      actionBy: req.user.id,
      statusFrom: currentStatus,
      statusTo: newStatus,
      approverRole: requisition.approverRole,
      comments: comments || '',
      tenantId: req.tenant.id
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: requisition
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error processing approval decision:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while processing approval'
    });
  }
};

/**
 * @desc    Add an item to a requisition
 * @route   POST /api/v1/requisitions/:id/items
 * @access  Private
 */
const addRequisitionItem = async (req, res) => {
  try {
    // Check if requisition exists and belongs to tenant
    const requisition = await Requisition.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });
    
    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }
    
    // Only allow adding items if status is Draft
    if (requisition.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        error: 'Cannot add items to a requisition that is not in Draft status'
      });
    }
    
    // Create the item with requisition ID and tenant ID
    const itemData = {
      ...req.body,
      requisitionId: requisition._id,
      tenantId: req.tenant.id,
      currency: req.body.currency || requisition.currency // Use requisition currency if not specified
    };
    
    const item = await RequisitionItem.create(itemData);
    
    // The post-save hook will update the total amount in the requisition
    
    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error adding requisition item:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Update a requisition item
 * @route   PUT /api/v1/requisitions/items/:itemId
 * @access  Private
 */
const updateRequisitionItem = async (req, res) => {
  try {
    // Find the item
    let item = await RequisitionItem.findOne({
      _id: req.params.itemId,
      tenantId: req.tenant.id
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Requisition item not found'
      });
    }
    
    // Check if requisition is in Draft status
    const requisition = await Requisition.findOne({
      _id: item.requisitionId,
      tenantId: req.tenant.id
    });
    
    if (!requisition || requisition.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update items in a requisition that is not in Draft status'
      });
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'requisitionId' && key !== 'tenantId') { // Prevent changing requisition and tenant
        item[key] = req.body[key];
      }
    });
    
    // Save will recalculate totalPrice via pre-save hook
    await item.save();
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error updating requisition item:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Delete a requisition item
 * @route   DELETE /api/v1/requisitions/items/:itemId
 * @access  Private
 */
const deleteRequisitionItem = async (req, res) => {
  try {
    // Find the item
    const item = await RequisitionItem.findOne({
      _id: req.params.itemId,
      tenantId: req.tenant.id
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Requisition item not found'
      });
    }
    
    // Check if requisition is in Draft status
    const requisition = await Requisition.findOne({
      _id: item.requisitionId,
      tenantId: req.tenant.id
    });
    
    if (!requisition || requisition.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete items from a requisition that is not in Draft status'
      });
    }
    
    // Remove item - this will trigger post-remove hook to update requisition total
    await item.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting requisition item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get all items for a requisition
 * @route   GET /api/v1/requisitions/:id/items
 * @access  Private
 */
const getRequisitionItems = async (req, res) => {
  try {
    // Check if requisition exists and belongs to tenant
    const requisition = await Requisition.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });
    
    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }
    
    // Get items
    const items = await RequisitionItem.find({
      requisitionId: requisition._id,
      tenantId: req.tenant.id
    }).populate('catalogProductId', 'name description');
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Error fetching requisition items:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get a single line item
 * @route   GET /api/v1/requisitions/items/:itemId
 * @access  Private
 */
const getRequisitionItemById = async (req, res) => {
  try {
    // Find the item
    const item = await RequisitionItem.findOne({
      _id: req.params.itemId,
      tenantId: req.tenant.id
    }).populate('catalogProductId', 'name description');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Requisition item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching requisition item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get all requisitions pending for approval for the current user
 * @route   GET /api/v1/requisitions/pending-approvals
 * @access  Private
 */
const getPendingApprovals = async (req, res) => {
  try {
    // Find all requisitions where current user is the approver
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const count = await Requisition.countDocuments({
      currentApprover: req.user.id,
      tenantId: req.tenant.id,
      status: { $regex: /^Pending/ } // Starts with "Pending"
    });

    const requisitions = await Requisition.find({
      currentApprover: req.user.id,
      tenantId: req.tenant.id,
      status: { $regex: /^Pending/ } // Starts with "Pending"
    })
      .populate('createdBy', 'name email')
      .populate('costCenterId', 'name code')
      .skip(startIndex)
      .limit(limit)
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      },
      data: requisitions
    });
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get all requisitions pending for approval for cost centers the user manages
 * @route   GET /api/v1/requisitions/pending-approvals/cost-center
 * @access  Private
 */
const getPendingCostCenterApprovals = async (req, res) => {
  try {
    // Find all cost centers where the current user is a manager/approver
    const costCenters = await CostCenter.find({
      managers: req.user.id,
      tenantId: req.tenant.id
    });

    if (costCenters.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Get cost center IDs
    const costCenterIds = costCenters.map(center => center._id);

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Count total pending requisitions for these cost centers
    const count = await Requisition.countDocuments({
      costCenterId: { $in: costCenterIds },
      tenantId: req.tenant.id,
      status: { $regex: /^Pending/ } // Starts with "Pending"
    });

    // Find all requisitions with these cost centers that are pending approval
    const requisitions = await Requisition.find({
      costCenterId: { $in: costCenterIds },
      tenantId: req.tenant.id,
      status: { $regex: /^Pending/ } // Starts with "Pending"
    })
      .populate('createdBy', 'name email')
      .populate('costCenterId', 'name code')
      .skip(startIndex)
      .limit(limit)
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      },
      data: requisitions
    });
  } catch (error) {
    console.error('Error getting cost center pending approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  getRequisitions,
  getRequisition,
  createRequisition,
  updateRequisition,
  deleteRequisition,
  submitRequisition,
  approveRequisition,
  getPendingCostCenterApprovals,
  getPendingApprovals,
  addRequisitionItem,
  updateRequisitionItem,
  deleteRequisitionItem,
  getRequisitionItems,
  getRequisitionItemById
};
