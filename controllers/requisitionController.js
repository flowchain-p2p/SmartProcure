const Requisition = require('../models/Requisition');
const RequisitionItem = require('../models/RequisitionItem');
const CostCenter = require('../models/CostCenter');
const User = require('../models/User');
const mongoose = require('mongoose');
const Location = require('../models/Location');
const { submitRequisitionForApproval, getMyPendingApprovals, processApprovalDecision } = require('./requisitionController-simple-approval');

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
    }    // Filter by createdBy if provided
    if (req.query.createdBy) {
      query.createdBy = req.query.createdBy;
    }
    
    // Filter by currentApprover if provided
    if (req.query.currentApprover) {
      query.currentApprover = req.query.currentApprover;
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
const createRequisition = async (req, res) => {  try {
    const { title, description, organizationId, costCenterId, categoryName, items, ...rest } = req.body;

    // Import the function to get vendor by category name
    const { getVendorByCategoryNameInternal } = require('./vendorController');

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
      categoryName, // Store category name at the requisition level
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
    
    // Determine if we have any custom items
    let requisitionType = 'catalogItem'; // Default to catalog items
    if (items && items.length > 0) {
      // Check if any item is marked as non-catalog
      const hasCustomItem = items.some(item => item.isCatalogItem === false);
      if (hasCustomItem) {
        requisitionType = 'customItem';
      }
    }
      
    // Set the requisition type based on its items
    requisitionData.requisitionType = requisitionType;
    
    const requisition = await Requisition.create(requisitionData);
    
    // Check if submitting directly (simplified approval flow)
    if (req.body.submitForApproval && requisition.costCenterId) {
      // Get cost center details for approval
      const costCenter = await CostCenter.findById(requisition.costCenterId)
        .populate('head')
        .populate('approvers.userId');
      
      if (costCenter) {
        // Collect approvers from cost center
        const approversToAdd = [];
        
        // Add cost center head as level 1 approver if exists
        if (costCenter.head) {
          approversToAdd.push({
            userId: costCenter.head._id,
            level: 1,
            status: 'Pending'
          });
        }
        
        // Add other approvers from cost center if any
        if (costCenter.approvers && costCenter.approvers.length > 0) {
          costCenter.approvers.forEach(approver => {
            approversToAdd.push({
              userId: approver.userId._id,
              level: approver.level || 2, // Default to level 2 if not specified
              status: 'Pending'
            });
          });
        }
        
        // Sort approvers by level
        if (approversToAdd.length > 0) {
          approversToAdd.sort((a, b) => a.level - b.level);
          
          // Update requisition with approvers
          requisition.approvers = approversToAdd;
          requisition.currentApprovalLevel = 1;
          requisition.status = 'Pending Approval';
          requisition.approvalStatus = 'In Progress';
          requisition.submittedAt = new Date();
          
          await requisition.save();
        }
      }
    }    // Create requisition items if provided
    let savedItems = [];
    if (items && items.length > 0) {
      // Process items and add vendorId if categoryName is provided
      const processedItems = await Promise.all(items.map(async (item) => {
        const itemData = {
          ...item,
          requisitionId: requisition._id,
          tenantId: req.tenant.id
        };
        
        // If item has categoryName but no vendorId, try to get vendor by category name
        if (item.categoryName && !item.vendorId) {
          const vendorResult = await getVendorByCategoryNameInternal(item.categoryName, req.tenant.id);
          if (vendorResult.success) {
            itemData.vendorId = vendorResult.data.vendorId;
            itemData.vendorName = vendorResult.data.vendorName || '';
            // Also store if this is a preferred vendor
            itemData.preferredVendor = vendorResult.data.preferred;
          }
        }
        
        return itemData;
      }));

      savedItems = await RequisitionItem.create(processedItems);
      
      // Log successful creation to debug
      console.log(`Created ${savedItems.length} requisition items for requisition ${requisition._id}`);
    }

    res.status(201).json({
      success: true,
      data: {
        ...requisition.toObject(),
        items: savedItems
      }
    });
  } catch (error) {
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

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
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
    }    // Optional: Check if frontend provided a specific workflow to use
    const { workflowId } = req.body;
    
    // Start the approval process using our approval service
    const { requisition: updatedRequisition, approvalInstance } = await approvalService.startApprovalProcess(
      requisition._id, 
      {
        userId: req.user.id,
        tenantId: req.tenant.id,
        workflowId
      }
    );
    
    // Get the current approvers for the UI to display
    const currentApprovers = await approvalService.getCurrentApprovers(
      requisition._id, 
      { tenantId: req.tenant.id }
    );

    res.status(200).json({
      success: true,
      data: {
        ...updatedRequisition.toObject(),
        approvalInstance: {
          currentStage: approvalInstance.approvals[approvalInstance.currentStageIndex].stage,
          currentApprovers: currentApprovers
        }
      }
    });
  } catch (error) {
    console.error('Error submitting requisition:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while submitting requisition'
    });
  }
};

/**
 * @desc    Approve or reject a requisition
 * @route   PATCH /api/v1/requisitions/:id/approve
 * @access  Private/Permission Based
 */
const approveRequisition = async (req, res) => {
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

    // Check if requisition has an approval instance
    if (!requisition.approvalInstanceId) {
      return res.status(400).json({
        success: false,
        error: 'This requisition does not have an approval workflow'
      });
    }

    // Find the approval instance and verify the user is an approver
    const approvalInstance = await ApprovalInstance.findOne({
      instanceId: requisition.approvalInstanceId,
      tenantId: req.tenant.id
    });

    if (!approvalInstance) {
      return res.status(400).json({
        success: false,
        error: 'Approval process is not in progress for this requisition'
      });
    }

    // Get current stage and check if user is a current approver
    const currentStage = approvalInstance.approvals[approvalInstance.currentStageIndex];
    const isApprover = currentStage.approvers.some(
      approver => approver.userId.toString() === req.user.id && approver.status === 'Pending'
    );

    if (!isApprover) {
      return res.status(403).json({
        success: false,
        error: 'You are not a current approver for this requisition'
      });
    }

    // Use our approval service to process the decision
    const { requisition: updatedRequisition, approvalInstance: updatedInstance } = 
      await approvalService.processApprovalDecision(
        requisition._id,
        {
          action: decision,
          comments: comments
        },
        {
          userId: req.user.id,
          tenantId: req.tenant.id
        }
      );
    
    // For backward compatibility, ensure we have the requisition object
    requisition = updatedRequisition;

    // Get the approval status to return to the UI
    const approvalStatus = await approvalService.getApprovalStatus(
      requisition._id, 
      { tenantId: req.tenant.id }
    );

    res.status(200).json({
      success: true,
      data: {
        ...requisition.toObject(),
        approvalStatus
      }
    });
  } catch (error) {
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
    // if (requisition.status !== 'Draft') {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Cannot add items to a requisition that is not in Draft status'
    //   });
    // }
      // Make sure isCatalogItem is properly set
    let isCatalogItem = req.body.isCatalogItem;
    if (isCatalogItem === undefined) {
      // If not explicitly set, infer from presence of catalogProductId
      isCatalogItem = !!req.body.catalogProductId;
    }
    
    // Create the item with requisition ID and tenant ID
    const itemData = {
      ...req.body,
      requisitionId: requisition._id,
      tenantId: req.tenant.id,
      currency: req.body.currency || requisition.currency, // Use requisition currency if not specified
      isCatalogItem: isCatalogItem
    };
    
    // For non-catalog items, ensure catalogProductId is not set
    if (!isCatalogItem) {
      delete itemData.catalogProductId;
    }
    
    // If item has categoryName but no vendorId, try to get vendor by category name
    if (req.body.categoryName && !req.body.vendorId) {
      // Import the function to get vendor by category name
      const { getVendorByCategoryNameInternal } = require('./vendorController');
      const vendorResult = await getVendorByCategoryNameInternal(req.body.categoryName, req.tenant.id);
      if (vendorResult.success) {
        itemData.vendorId = vendorResult.data.vendorId;
        itemData.vendorName = vendorResult.data.vendorName || '';
        // Also store if this is a preferred vendor
        itemData.preferredVendor = vendorResult.data.preferred;
      }
    }
    
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

/**
 * @desc    Get approval status for a requisition
 * @route   GET /api/v1/requisitions/:id/approval-status
 * @access  Private
 */
const getRequisitionApprovalStatus = async (req, res) => {
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

    // If no approval instance exists, return basic status
    if (!requisition.approvalInstanceId) {
      return res.status(200).json({
        success: true,
        data: {
          status: 'Not Started',
          currentStage: null,
          currentApprovers: [],
          completedStages: [],
          isComplete: false
        }
      });
    }

    // Get detailed approval status
    const approvalStatus = await approvalService.getApprovalStatus(
      requisition._id, 
      { tenantId: req.tenant.id }
    );

    res.status(200).json({
      success: true,
      data: approvalStatus
    });
  } catch (error) {
    console.error('Error getting requisition approval status:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching approval status'
    });  }
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
  getRequisitionItemById,
  getRequisitionApprovalStatus,
  // New simple approval functions
  submitRequisitionForApproval,
  getMyPendingApprovals,
  processApprovalDecision
};
