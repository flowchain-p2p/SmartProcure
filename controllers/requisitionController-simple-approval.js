const mongoose = require('mongoose');
const Requisition = require('../models/Requisition');
const RequisitionItem = require('../models/RequisitionItem');
const CostCenter = require('../models/CostCenter');
const User = require('../models/User');

/**
 * @desc    Submit requisition for approval
 * @route   POST /api/v1/requisitions/:id/submit
 * @access  Private
 */
const submitRequisitionForApproval = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const requisition = await Requisition.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    }).session(session);

    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }

    // Check if the requisition is in Draft status
    if (requisition.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        error: 'Only requisitions in Draft status can be submitted for approval'
      });
    }

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
    
    await requisition.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      data: requisition
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
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
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const requisitions = await Requisition.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(req.tenant.id),
          status: 'Pending Approval',
          approvers: {
            $elemMatch: {
              userId: new mongoose.Types.ObjectId(userId),
              status: 'Pending'
            }
          }
        }
      },
      {
        $addFields: {
          isCurrentLevelApprover: {
            $anyElementTrue: {
              $map: {
                input: {
                  $filter: {
                    input: "$approvers",
                    as: "approver",
                    cond: { 
                      $and: [
                        { $eq: ["$$approver.userId", mongoose.Types.ObjectId(userId)] },
                        { $eq: ["$$approver.level", "$currentApprovalLevel"] },
                        { $eq: ["$$approver.status", "Pending"] }
                      ]
                    }
                  }
                },
                as: "filteredApprover",
                in: { $toBool: "$$filteredApprover" }
              }
            }
          }
        }
      },
      {
        $match: {
          isCurrentLevelApprover: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdByUser'
        }
      },
      {
        $lookup: {
          from: 'costcenters',
          localField: 'costCenterId',
          foreignField: '_id',
          as: 'costCenter'
        }
      },
      {
        $project: {
          _id: 1,
          requisitionNumber: 1,
          title: 1,
          description: 1,
          status: 1,
          approvalStatus: 1,
          currentApprovalLevel: 1,
          totalAmount: 1,
          currency: 1,
          submittedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          createdBy: { $arrayElemAt: ["$createdByUser", 0] },
          costCenter: { $arrayElemAt: ["$costCenter", 0] },
          isCurrentLevelApprover: 1
        }
      },
      {
        $sort: { submittedAt: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: parseInt(limit)
      }
    ]);
      const count = await Requisition.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(req.tenant.id),
          status: 'Pending Approval',
          approvers: {
            $elemMatch: {
              userId: new mongoose.Types.ObjectId(userId),
              status: 'Pending'
            }
          }
        }
      },
      {
        $addFields: {
          isCurrentLevelApprover: {
            $anyElementTrue: {
              $map: {
                input: {
                  $filter: {
                    input: "$approvers",
                    as: "approver",
                    cond: { 
                      $and: [
                        { $eq: ["$$approver.userId", mongoose.Types.ObjectId(userId)] },
                        { $eq: ["$$approver.level", "$currentApprovalLevel"] },
                        { $eq: ["$$approver.status", "Pending"] }
                      ]
                    }
                  }
                },
                as: "filteredApprover",
                in: { $toBool: "$$filteredApprover" }
              }
            }
          }
        }
      },
      {
        $match: {
          isCurrentLevelApprover: true
        }
      },
      {
        $count: 'total'
      }
    ]);
    
    res.status(200).json({
      success: true,
      count: count.length > 0 ? count[0].total : 0,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: count.length > 0 ? Math.ceil(count[0].total / parseInt(limit)) : 0
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
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    // Find the requisition
    const requisition = await Requisition.findOne({
      _id: id,
      tenantId: req.tenant.id
    }).session(session);
    
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
      
      const allApproved = currentLevelApprovers.every(
        approver => approver.status === 'Approved'
      );
      
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
        }
      }
    }
    
    await requisition.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
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

module.exports = {
  submitRequisitionForApproval,
  getMyPendingApprovals,
  processApprovalDecision
};
