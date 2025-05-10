const mongoose = require('mongoose');
const Requisition = require('../models/Requisition');
const RequisitionItem = require('../models/RequisitionItem');
const CostCenter = require('../models/CostCenter');
const User = require('../models/User');
const PurchaseOrder = require('../models/PurchaseOrder');
const RFQ = require('../models/RFQ');

/**
 * @desc    Submit requisition for approval
 * @route   POST /api/v1/requisitions/:id/submit
 * @access  Private
 */
const submitRequisitionForApproval = async (req, res) => {
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

    // Check if the requisition is in Draft status
    // if (requisition.status !== 'Draft') {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'Only requisitions in Draft status can be submitted for approval'
    //   });
    // }

    // Get cost center details
    const costCenter = await CostCenter.findById(requisition.costCenterId)
      .populate('head')
      .populate('approvers.userId');
    
    if (!costCenter) {
      return res.status(404).json({
        success: false,
        error: 'Cost center not found'
      });
    }
    
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
    
    // If no approvers found, return error
    if (approversToAdd.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No approvers found for this cost center'
      });
    }
    
    // Sort approvers by level
    approversToAdd.sort((a, b) => a.level - b.level);
    
    // Update requisition
    requisition.approvers = approversToAdd;
    requisition.currentApprovalLevel = 1;
    requisition.status = 'Pending Approval';
    requisition.approvalStatus = 'In Progress';
    requisition.submittedAt = new Date();
    
    await requisition.save();
    
    res.status(200).json({
      success: true,
      data: requisition
    });
  } catch (error) {
    console.error('Error submitting requisition for approval:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get requisitions pending for approval by the current user
 * @route   GET /api/v1/requisitions/my-pending-approvals
 * @access  Private
 */
const getMyPendingApprovals = async (req, res) => {
  try {
    const userId = req.user.id;
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const tenantIdObj = new mongoose.Types.ObjectId(req.tenant.id);
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Find requisitions that are pending approval where the user is an approver
    const query = {
      tenantId: tenantIdObj,
      status: 'Pending Approval',
      // 'approvers.userId': userIdObj,
      // 'approvers.status': 'Pending'
    };
    
    // Get total count for pagination
    const totalCount = await Requisition.countDocuments(query);
    
    // Fetch requisitions
    let requisitions = await Requisition.find(query)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(); // Using lean() for better performance since we're only reading data
    
    // Filter to only those where user is a current level approver
    requisitions = requisitions.filter(req => {
      // Check if the user is an approver at the current level
      return req.approvers.some(approver => 
        approver.userId.toString() === userId && 
        approver.level === req.currentApprovalLevel && 
        approver.status === 'Pending'
      );
    });
    
    // Get creators and cost centers in batches
    const creatorIds = [...new Set(requisitions.map(req => req.createdBy))];
    const costCenterIds = [...new Set(requisitions.map(req => req.costCenterId).filter(Boolean))];
    
    // Fetch related data
    const [creators, costCenters] = await Promise.all([
      User.find({ _id: { $in: creatorIds } }).lean(),
      CostCenter.find({ _id: { $in: costCenterIds } }).lean()
    ]);
    
    // Create lookup maps for quick access
    const creatorMap = creators.reduce((map, user) => {
      map[user._id.toString()] = user;
      return map;
    }, {});
    
    const costCenterMap = costCenters.reduce((map, cc) => {
      map[cc._id.toString()] = cc;
      return map;
    }, {});
    
    // Enrich requisitions with related data
    const enrichedRequisitions = requisitions.map(req => {
      const result = {
        _id: req._id,
        requisitionNumber: req.requisitionNumber,
        title: req.title,
        description: req.description,
        status: req.status,
        approvalStatus: req.approvalStatus,
        currentApprovalLevel: req.currentApprovalLevel,
        totalAmount: req.totalAmount,
        currency: req.currency,
        submittedAt: req.submittedAt,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
        isCurrentLevelApprover: true, // We've already filtered for current level approvers
      };
      
      // Add creator if available
      if (req.createdBy && creatorMap[req.createdBy.toString()]) {
        result.createdBy = creatorMap[req.createdBy.toString()];
      }
      
      // Add cost center if available
      if (req.costCenterId && costCenterMap[req.costCenterId.toString()]) {
        result.costCenter = costCenterMap[req.costCenterId.toString()];
      }
      
      return result;
    });
    
    // Calculate number of filtered items for pagination
    const filteredCount = enrichedRequisitions.length;
    
    res.status(200).json({
      success: true,
      count: filteredCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(filteredCount / limitNum) || 0
      },
      data: enrichedRequisitions
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
 * @desc    Process approval decision
 * @route   POST /api/v1/requisitions/:id/approval-decision
 * @access  Private
 */
const processApprovalDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, comments } = req.body;
    const userId = req.user.id;
    
    if (!decision || !['approve', 'reject'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: 'Valid decision (approve or reject) is required'
      });
    }
    
    // Find the requisition
    const requisition = await Requisition.findOne({
      _id: id,
      tenantId: req.tenant.id
    });
    
    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }
    
    // Find the approver entry for the current user at the current level
    const approverIndex = requisition.approvers.findIndex(
      approver => 
        approver.userId.toString() === userId &&
        approver.level === requisition.currentApprovalLevel &&
        approver.status === 'Pending'
    );
    
    if (approverIndex === -1) {
      return res.status(403).json({
        success: false,
        error: 'You are not a current approver for this requisition'
      });
    }
    
    // Update approver status
    requisition.approvers[approverIndex].status = decision === 'approve' ? 'Approved' : 'Rejected';
    requisition.approvers[approverIndex].comments = comments;
    requisition.approvers[approverIndex].actionDate = new Date();
    
    // Process the decision
    if (decision === 'reject') {
      // If rejected, update the requisition status
      requisition.status = 'Rejected';
      requisition.approvalStatus = 'Rejected';
    } else {
      // If approved, check if all approvers at the current level have approved
      const currentLevelApprovers = requisition.approvers.filter(
        approver => approver.level === requisition.currentApprovalLevel
      );
      
      const allApproved = true
        if (allApproved) {
        // Find the next approval level
        const nextLevel = Math.min(...requisition.approvers
          .filter(approver => approver.level > requisition.currentApprovalLevel)
          .map(approver => approver.level));
        
        if (isFinite(nextLevel)) {
          // Move to next approval level
          requisition.currentApprovalLevel = nextLevel;
        } else {
          // No more approval levels - fully approved
          requisition.status = 'Approved';
          requisition.approvalStatus = 'Approved';
          requisition.approvedBy = userId;
          
          // Get the full requisition details to check its type
          const updatedReq = await Requisition.findById(id).populate('items');
          
          if (updatedReq) {
            // If the requisition type is catalogItem, create a PO with draft status
            if (updatedReq.requisitionType === 'catalogItem') {
              try {
                const tenantId = req.tenant.id;
                const newPO = await createPurchaseOrderFromRequisition(updatedReq, userId, tenantId);
                if (newPO) {
                  console.log(`Successfully created Purchase Order ${newPO.poNumber} for approved requisition ${updatedReq.requisitionNumber}`);
                }
              } catch (poError) {
                console.error(`Error creating Purchase Order for requisition ${id}:`, poError);
                // We don't throw the error here to avoid disrupting the approval process
              }
            } 
            // If the requisition type is customItem, create an RFQ with draft status
            else if (updatedReq.requisitionType === 'customItem') {
              try {
                const tenantId = req.tenant.id;
                const newRFQ = await createRFQFromRequisition(updatedReq, userId, tenantId);
                if (newRFQ) {
                  console.log(`Successfully created RFQ ${newRFQ.rfqNumber} for approved requisition ${updatedReq.requisitionNumber}`);
                }
              } catch (rfqError) {
                console.error(`Error creating RFQ for requisition ${id}:`, rfqError);
                // We don't throw the error here to avoid disrupting the approval process
              }
            }
          }
        }
      }
    }
    
    await requisition.save();
    
    res.status(200).json({
      success: true,
      data: requisition
    });
  } catch (error) {
    console.error('Error processing approval decision:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Creates a Purchase Order from an approved Requisition
 * @param {Object} requisition - The approved requisition
 * @param {String} userId - ID of the user who approved the requisition
 * @param {String} tenantId - The tenant ID
 * @returns {Promise<Object>} - The created purchase order
 */
const createPurchaseOrderFromRequisition = async (requisition, userId, tenantId) => {
  try {
    // Get all items related to this requisition
    const requisitionItems = await RequisitionItem.find({
      requisitionId: requisition._id,
      tenantId: tenantId
    }).populate('catalogProductId');

    // If there are no items, we can't create a PO
    if (!requisitionItems || requisitionItems.length === 0) {
      console.log(`No items found for requisition ${requisition._id}, skipping PO creation`);
      return null;
    }

    // Find the primary vendor from the first item (assuming all items are from same vendor)
    // If no vendor specified, we can't create a PO
    let vendorId = null;
    for (const item of requisitionItems) {
      if (item.vendorId) {
        vendorId = item.vendorId;
        break;
      }
    }

    if (!vendorId) {
      console.log(`No vendor found for requisition items in ${requisition._id}, skipping PO creation`);
      return null;
    }

    // Generate PO number
    const poCount = await PurchaseOrder.countDocuments({ tenantId });
    const poNumber = `PO-${tenantId}-${new Date().getFullYear()}-${(poCount + 1).toString().padStart(4, '0')}`;

    // Convert requisition items to PO items
    const poItems = requisitionItems.map(item => ({
      description: item.name || (item.catalogProductId ? item.catalogProductId.name : 'Unknown Item'),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      currency: item.currency || 'INR',
      catalogItemId: item.catalogProductId ? item.catalogProductId._id : undefined,
      requisitionItemId: item._id,
      unitOfMeasure: item.unit || 'Each',
      notes: item.notes
    }));

    // Create the Purchase Order
    const po = await PurchaseOrder.create({
      poNumber,
      title: `PO for ${requisition.title}`,
      description: requisition.description,
      status: 'Draft', // Always create as draft initially
      tenantId,
      organizationId: requisition.organizationId,
      vendorId: vendorId,
      requisitionId: requisition._id,
      items: poItems,
      totalAmount: requisition.totalAmount,
      currency: requisition.currency || 'INR',
      createdBy: userId,
      notes: `Auto-generated from Requisition ${requisition.requisitionNumber}`
    });

    console.log(`Created PO ${po.poNumber} from requisition ${requisition.requisitionNumber}`);
    return po;
  } catch (error) {
    console.error(`Error creating Purchase Order from requisition ${requisition._id}:`, error);
    return null;
  }
};

/**
 * Creates an RFQ from an approved Requisition
 * @param {Object} requisition - The approved requisition
 * @param {String} userId - ID of the user who approved the requisition
 * @param {String} tenantId - The tenant ID
 * @returns {Promise<Object>} - The created RFQ
 */
const createRFQFromRequisition = async (requisition, userId, tenantId) => {
  try {
    // Get all items related to this requisition
    const requisitionItems = await RequisitionItem.find({
      requisitionId: requisition._id,
      tenantId: tenantId
    });

    // If there are no items, we can't create an RFQ
    if (!requisitionItems || requisitionItems.length === 0) {
      console.log(`No items found for requisition ${requisition._id}, skipping RFQ creation`);
      return null;
    }

    // Generate RFQ number
    const rfqCount = await RFQ.countDocuments({ tenantId });
    const rfqNumber = `RFQ-${tenantId}-${new Date().getFullYear()}-${(rfqCount + 1).toString().padStart(4, '0')}`;

    // Convert requisition items to RFQ items
    const rfqItems = requisitionItems.map(item => ({
      description: item.name || 'Custom Item',
      quantity: item.quantity,
      unitOfMeasure: item.unit || 'Each',
      estimatedUnitPrice: item.unitPrice || 0,
      estimatedTotalPrice: item.totalPrice || 0,
      requisitionItemId: item._id,
      notes: item.notes
    }));

    // Set submission deadline to 7 days from now
    const submissionDeadline = new Date();
    submissionDeadline.setDate(submissionDeadline.getDate() + 7);

    // Calculate estimated total amount
    const estimatedTotalAmount = rfqItems.reduce((total, item) => total + (item.estimatedTotalPrice || 0), 0);

    // Create the RFQ
    const rfq = await RFQ.create({
      rfqNumber,
      title: `RFQ for ${requisition.title}`,
      description: requisition.description,
      status: 'Draft', // Always create as draft
      tenantId: requisition.tenantId,
      organizationId: requisition.organizationId,
      requisitionId: requisition._id,
      items: rfqItems,
      submissionDeadline: submissionDeadline,
      estimatedTotalAmount: estimatedTotalAmount,
      currency: requisition.currency || 'INR',
      createdBy: userId,
      notes: `Auto-generated from Requisition ${requisition.requisitionNumber}`
    });

    console.log(`Created RFQ ${rfq.rfqNumber} from requisition ${requisition.requisitionNumber}`);
    return rfq;
  } catch (error) {
    console.error(`Error creating RFQ from requisition ${requisition._id}:`, error);
    return null;
  }
};

module.exports = {
  submitRequisitionForApproval,
  getMyPendingApprovals,
  processApprovalDecision,
  createPurchaseOrderFromRequisition,
  createRFQFromRequisition
};
