const ApprovalInstance = require('../models/ApprovalInstance');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const ApprovalHistory = require('../models/ApprovalHistory');
const Requisition = require('../models/Requisition');
const CostCenter = require('../models/CostCenter');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Creates a new approval instance for a requisition
 * @param {Object} requisitionData - The requisition object
 * @param {Object} options - Options including tenant ID, workflow ID, etc.
 * @returns {Promise<Object>} - The created approval instance
 */
const createApprovalInstance = async (requisitionData, options = {}) => {
  const { tenantId, workflowId = null } = options;
  
  // Generate instance ID
  const instanceId = `approvalInstance-${requisitionData._id}`;
  
  // Determine the workflow to use
  let workflow;
  if (workflowId) {
    // Use the specified workflow
    workflow = await ApprovalWorkflow.findById(workflowId);
  } else {
    // Find a default workflow for requisitions
    workflow = await ApprovalWorkflow.findOne({
      tenantId,
      type: 'requisition'
    });
  }
  
  if (!workflow) {
    throw new Error('No workflow found for approval instance');
  }
  
  // Set up the approval stages based on the workflow
  const approvalStages = [];
  
  // Add only Cost Center approval stage
  if (requisitionData.costCenterId) {
    const costCenter = await CostCenter.findById(requisitionData.costCenterId);
    if (costCenter && costCenter.head) {
      approvalStages.push({
        stage: 'Cost Center Approval',
        stageOrder: 0,
        approvers: [{
          userId: costCenter.head,
          role: 'CostCenterHead',
          status: 'Pending'
        }]
      });
    }
  }
  
  // Create the approval instance
  const approvalInstance = await ApprovalInstance.create({
    instanceId,
    requisitionId: requisitionData._id,
    workflowId: workflow._id,
    currentStageIndex: 0,
    status: 'Draft',
    approvals: approvalStages,
    tenantId
  });
  
  return approvalInstance;
};

/**
 * Starts the approval process for a requisition
 * @param {String} requisitionId - The ID of the requisition
 * @param {Object} options - Options including user ID, tenant ID, etc.
 * @returns {Promise<Object>} - Updated requisition and approval instance
 */
const startApprovalProcess = async (requisitionId, options = {}) => {
  const { userId, tenantId } = options;
  
  // Find the requisition
  const requisition = await Requisition.findOne({
    _id: requisitionId,
    tenantId
  });
  
  if (!requisition) {
    throw new Error('Requisition not found');
  }
  
  // Check if approval instance already exists
  let approvalInstance;
  if (requisition.approvalInstanceId) {
    approvalInstance = await ApprovalInstance.findOne({
      instanceId: requisition.approvalInstanceId,
      tenantId
    });
  }
  
  // Create a new approval instance if none exists
  if (!approvalInstance) {
    approvalInstance = await createApprovalInstance(requisition, {
      tenantId,
      userId
    });
    
    // Update the requisition with the instance ID
    await Requisition.updateOne(
      { _id: requisitionId },
      { 
        approvalInstanceId: approvalInstance.instanceId
      }
    );
  }
  
  // Start the approval process if not already started
  if (approvalInstance.status === 'Draft') {
    // Update instance status
    approvalInstance.status = 'Pending Approval';
    approvalInstance.startedAt = new Date();
    await approvalInstance.save();
    
    // Update requisition status
    const firstStage = approvalInstance.approvals[0];
    
    // For backward compatibility, update the legacy fields too
    await Requisition.updateOne(
      { _id: requisitionId },
      {
        status: 'Pending Approval',
        submittedAt: new Date(),
        currentApprover: firstStage.approvers[0].userId,
        approvalStage: firstStage.stage.replace(' Approval', ''),
        approverRole: firstStage.approvers[0].role
      }
    );
    
    // Create approval history entry
    await ApprovalHistory.create({
      requisitionId,
      actionType: 'Submitted',
      actionBy: userId,
      statusFrom: 'Draft',
      statusTo: 'Pending Approval',
      approverRole: firstStage.approvers[0].role,
      tenantId
    });
  }
  
  // Fetch the updated requisition
  const updatedRequisition = await Requisition.findById(requisitionId);
  
  return {
    requisition: updatedRequisition,
    approvalInstance
  };
};

/**
 * Process an approval decision (approve, reject, return)
 * @param {String} requisitionId - The ID of the requisition
 * @param {Object} decision - Decision details (action, comments, etc.)
 * @param {Object} options - Options including user ID, tenant ID, etc.
 * @returns {Promise<Object>} - Updated requisition and approval instance
 */
const processApprovalDecision = async (requisitionId, decision, options = {}) => {
  const { userId, tenantId } = options;
  const { action, comments } = decision;
  
  // Find the requisition
  const requisition = await Requisition.findOne({
    _id: requisitionId,
    tenantId
  });
  
  if (!requisition) {
    throw new Error('Requisition not found');
  }
  
  // Find approval instance
  const approvalInstance = await ApprovalInstance.findOne({
    instanceId: requisition.approvalInstanceId,
    tenantId
  }).populate('approvals.approvers.userId');
  
  if (!approvalInstance) {
    throw new Error('Approval instance not found');
  }
  
  // Verify the user is a current approver
  const currentStage = approvalInstance.approvals[approvalInstance.currentStageIndex];
  const approverIndex = currentStage.approvers.findIndex(
    approver => approver.userId._id.toString() === userId
  );
  
  if (approverIndex === -1) {
    throw new Error('User is not a current approver for this requisition');
  }
  
  // Process the decision
  const currentStatus = requisition.status;
  let newStatus, newApprovalStage;
  
  switch (action.toLowerCase()) {
    case 'approve':
      // Update current approver's status
      currentStage.approvers[approverIndex].status = 'Approved';
      currentStage.approvers[approverIndex].comments = comments;
      currentStage.approvers[approverIndex].actionDate = new Date();
      
      // Check if all approvers in current stage have approved
      const allApproved = currentStage.approvers.every(
        approver => approver.status === 'Approved'
      );
      
      if (allApproved) {
        // Move to next stage if available
        if (approvalInstance.currentStageIndex < approvalInstance.approvals.length - 1) {
          // Advance to next stage
          approvalInstance.currentStageIndex++;
          
          const nextStage = approvalInstance.approvals[approvalInstance.currentStageIndex];
          newStatus = 'Pending Approval';
          newApprovalStage = nextStage.stage.replace(' Approval', '');
          
          // Update requisition for backward compatibility
          await Requisition.updateOne(
            { _id: requisitionId },
            {
              status: newStatus,
              approvalStage: newApprovalStage,
              currentApprover: nextStage.approvers[0].userId,
              approverRole: nextStage.approvers[0].role
            }
          );
        } else {
          // Final approval
          approvalInstance.status = 'Approved';
          approvalInstance.completedAt = new Date();
          
          // Update requisition
          await Requisition.updateOne(
            { _id: requisitionId },
            {
              status: 'Approved',
              approvalStage: 'Complete',
              approvedBy: userId
            }
          );
          
          newStatus = 'Approved';
          newApprovalStage = 'Complete';
        }
      }
      break;
    
    case 'reject':
      // Update approver status
      currentStage.approvers[approverIndex].status = 'Rejected';
      currentStage.approvers[approverIndex].comments = comments;
      currentStage.approvers[approverIndex].actionDate = new Date();
      
      // Update instance status
      approvalInstance.status = 'Rejected';
      approvalInstance.completedAt = new Date();
      
      // Update requisition
      await Requisition.updateOne(
        { _id: requisitionId },
        {
          status: 'Rejected',
          approvalStage: 'Complete'
        }
      );
      
      newStatus = 'Rejected';
      newApprovalStage = 'Complete';
      break;
    
    case 'return':
      // Update approver status
      currentStage.approvers[approverIndex].status = 'Returned';
      currentStage.approvers[approverIndex].comments = comments;
      currentStage.approvers[approverIndex].actionDate = new Date();
      
      // Update instance status
      approvalInstance.status = 'Returned';
      
      // Update requisition
      await Requisition.updateOne(
        { _id: requisitionId },
        {
          status: 'Returned',
          approvalStage: 'Not Started'
        }
      );
      
      newStatus = 'Returned';
      newApprovalStage = 'Not Started';
      break;
    
    default:
      throw new Error('Invalid approval action');
  }
  
  // Save the updated approval instance
  await approvalInstance.save();
  
  // Create approval history entry
  await ApprovalHistory.create({
    requisitionId,
    actionType: action.charAt(0).toUpperCase() + action.slice(1),
    actionBy: userId,
    statusFrom: currentStatus,
    statusTo: newStatus,
    comments,
    approverRole: currentStage.approvers[approverIndex].role,
    tenantId
  });
  
  // Fetch the updated requisition
  const updatedRequisition = await Requisition.findById(requisitionId);
  
  return {
    requisition: updatedRequisition,
    approvalInstance
  };
};

/**
 * Gets current approvers for a requisition
 * @param {String} requisitionId - The ID of the requisition
 * @param {Object} options - Options including tenant ID, etc.
 * @returns {Promise<Array>} - List of current approvers
 */
const getCurrentApprovers = async (requisitionId, options = {}) => {
  const { tenantId } = options;
  
  // Find the requisition
  const requisition = await Requisition.findOne({
    _id: requisitionId,
    tenantId
  });
  
  if (!requisition) {
    throw new Error('Requisition not found');
  }
  
  // No approval instance means no approvers
  if (!requisition.approvalInstanceId) {
    return [];
  }
  
  // Find approval instance
  const approvalInstance = await ApprovalInstance.findOne({
    instanceId: requisition.approvalInstanceId,
    tenantId
  }).populate('approvals.approvers.userId', 'name email');
  
  if (!approvalInstance || approvalInstance.status !== 'InProgress') {
    return [];
  }
  
  // Get current stage approvers
  const currentStage = approvalInstance.approvals[approvalInstance.currentStageIndex];
  const pendingApprovers = currentStage.approvers
    .filter(approver => approver.status === 'Pending')
    .map(approver => ({
      userId: approver.userId._id,
      name: approver.userId.name,
      email: approver.userId.email,
      role: approver.role
    }));
  
  return pendingApprovers;
};

/**
 * Gets approval status for a requisition
 * @param {String} requisitionId - The ID of the requisition
 * @param {Object} options - Options including tenant ID, etc.
 * @returns {Promise<Object>} - Approval status details
 */
const getApprovalStatus = async (requisitionId, options = {}) => {
  const { tenantId } = options;
  
  // Find the requisition
  const requisition = await Requisition.findOne({
    _id: requisitionId,
    tenantId
  });
  
  if (!requisition) {
    throw new Error('Requisition not found');
  }
  
  // No approval instance means approval not started
  if (!requisition.approvalInstanceId) {
    return {
      status: 'Not Started',
      currentStage: null,
      currentApprovers: [],
      completedStages: [],
      isComplete: false
    };
  }
  
  // Find approval instance
  const approvalInstance = await ApprovalInstance.findOne({
    instanceId: requisition.approvalInstanceId,
    tenantId
  }).populate('approvals.approvers.userId', 'name email');
  
  if (!approvalInstance) {
    return {
      status: 'Not Started',
      currentStage: null,
      currentApprovers: [],
      completedStages: [],
      isComplete: false
    };
  }
  
  // Format the response
  const currentStage = approvalInstance.currentStageIndex < approvalInstance.approvals.length
    ? approvalInstance.approvals[approvalInstance.currentStageIndex]
    : null;
  
  const currentApprovers = currentStage
    ? currentStage.approvers
      .filter(approver => approver.status === 'Pending')
      .map(approver => ({
        userId: approver.userId._id,
        name: approver.userId.name,
        email: approver.userId.email,
        role: approver.role
      }))
    : [];
  
  const completedStages = approvalInstance.approvals
    .filter((stage, index) => index < approvalInstance.currentStageIndex)
    .map(stage => ({
      stage: stage.stage,
      stageOrder: stage.stageOrder,
      approvers: stage.approvers.map(approver => ({
        name: approver.userId.name,
        role: approver.role,
        status: approver.status,
        comments: approver.comments,
        actionDate: approver.actionDate
      }))
    }));
  
  return {
    status: approvalInstance.status,
    currentStage: currentStage ? {
      stage: currentStage.stage,
      stageOrder: currentStage.stageOrder
    } : null,
    currentApprovers,
    completedStages,
    isComplete: ['Approved', 'Rejected', 'Cancelled'].includes(approvalInstance.status)
  };
};

module.exports = {
  createApprovalInstance,
  startApprovalProcess,
  processApprovalDecision,
  getCurrentApprovers,
  getApprovalStatus
};
