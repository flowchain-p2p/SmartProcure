/**
 * Migration script to create approval instances for existing requisitions
 * This script will:
 * 1. Find all requisitions that are in some stage of approval
 * 2. Create approval instances for each
 * 3. Update the requisition with the approval instance ID
 */
// No need for dotenv since URI is hardcoded in database.js
const mongoose = require('mongoose');

// Import all required models
// Note the order is important for dependencies
require('../models/Tenant');
require('../models/Department');
const Requisition = require('../models/Requisition');
const ApprovalInstance = require('../models/ApprovalInstance');
// ApprovalHistory removed for MVP
const User = require('../models/User');
const CostCenter = require('../models/CostCenter');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');

// Connect to MongoDB using the same connection string as in database.js
mongoose.connect("mongodb://admin:admin@localhost:27017/SmartProcureDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

/**
 * Create a default workflow if none exists
 * @param {String} tenantId - The tenant ID
 * @returns {Promise<Object>} - The workflow object
 */
const ensureDefaultWorkflow = async (tenantId) => {
  // Check if workflow already exists
  let workflow = await ApprovalWorkflow.findOne({
    tenantId,
    type: 'requisition'
  });
  
  if (!workflow) {
    // Create a basic default workflow
    workflow = await ApprovalWorkflow.create({
      name: 'Default Requisition Approval',
      tenantId,
      type: 'requisition',
      thresholds: [{
        amount: 0,
        requiredApprovals: [
          { role: 'CostCenterHead', level: 1 },
          { role: 'DepartmentHead', level: 2 },
          { role: 'Finance', level: 3 }
        ]
      }]
    });
    
    console.log(`Created default workflow for tenant ${tenantId}`);
  }
  
  return workflow;
};

/**
 * Create an approval instance for a requisition
 * @param {Object} requisition - The requisition document
 * @returns {Promise<Object>} - The created approval instance
 */
const createApprovalInstanceFromRequisition = async (requisition) => {
  // Skip if already has an instance
  if (requisition.approvalInstanceId) {
    console.log(`Requisition ${requisition._id} already has an approval instance`);
    return null;
  }
  
  // Get a default workflow
  const workflow = await ensureDefaultWorkflow(requisition.tenantId);
    // Generate the instance ID
  const instanceId = `approvalInstance-${requisition._id}`;
  
  // No approval history needed for MVP
  const approvalHistory = []; // Empty array as placeholder
  
  // Determine the current stage based on the requisition's approvalStage
  let currentStageIndex = 0;
  switch (requisition.approvalStage) {
    case 'Cost Center':
      currentStageIndex = 0;
      break;
    case 'Department':
      currentStageIndex = 1;
      break;
    case 'Finance':
      currentStageIndex = 2;
      break;
    case 'Complete':
      // For completed requisitions, set to the last stage
      if (requisition.status === 'Approved' || requisition.status === 'Rejected') {
        currentStageIndex = 3; // Past all stages
      }
      break;
    default:
      currentStageIndex = 0;
  }
  
  // Build the approval stages based on the current state
  const approvalStages = [];
  
  // Add Cost Center stage
  const costCenter = await CostCenter.findById(requisition.costCenterId);
  if (costCenter && costCenter.head) {
    const stageStatus = currentStageIndex > 0 ? 'Approved' : 'Pending';
    const costCenterStage = {
      stage: 'Cost Center Approval',
      stageOrder: 0,
      approvers: [{
        userId: costCenter.head,
        role: 'CostCenterHead',
        status: stageStatus
      }]
    };
      if (stageStatus === 'Approved') {
      // No approval history for MVP, use current date
      costCenterStage.approvers[0].actionDate = new Date();
      costCenterStage.approvers[0].comments = '';
    }
    
    approvalStages.push(costCenterStage);
  }
    // Add Department stage
  // Instead of relying on a populated department, let's check if the user has a departmentId
  // and try to find the department's manager/head directly
  const createdByUser = await User.findById(requisition.createdBy);
  let departmentHead = null;
  
  if (createdByUser && createdByUser.departmentId) {
    const department = await mongoose.model('Department').findById(createdByUser.departmentId);
    if (department && department.manager) {
      departmentHead = department.manager;
    }
  }
  
  if (departmentHead) {
    const stageStatus = currentStageIndex > 1 ? 'Approved' : 
                        (currentStageIndex === 1 ? 'Pending' : 'Pending');
    
    const departmentStage = {
      stage: 'Department Approval',
      stageOrder: 1,
      approvers: [{
        userId: departmentHead,
        role: 'DepartmentHead',
        status: stageStatus
      }]
    };
    
    if (stageStatus === 'Approved') {      // No approval history for MVP
      departmentStage.approvers[0].actionDate = new Date();
      departmentStage.approvers[0].comments = '';
    }
    
    approvalStages.push(departmentStage);
  }
  
  // Add Finance stage
  const financeUsers = await User.find({ 
    roles: { $in: ['Finance'] },
    tenantId: requisition.tenantId,
    active: true
  }).sort({ approvalHierarchy: -1 }).limit(1);
  
  if (financeUsers && financeUsers.length > 0) {
    const stageStatus = currentStageIndex > 2 ? 'Approved' : 
                        (currentStageIndex === 2 ? 'Pending' : 'Pending');
    
    const financeStage = {
      stage: 'Finance Approval',
      stageOrder: 2,
      approvers: [{
        userId: financeUsers[0]._id,
        role: 'Finance',
        status: stageStatus
      }]
    };
    
    if (stageStatus === 'Approved') {
      // Look for approval history      // No approval history for MVP
      financeStage.approvers[0].actionDate = new Date();
      financeStage.approvers[0].comments = '';
    }
    
    approvalStages.push(financeStage);
  }
  
  // Determine instance status based on requisition status
  let instanceStatus = 'Draft';
  let startedAt = null;
  let completedAt = null;
  
  switch (requisition.status) {
    case 'Pending Approval':
    case 'Pending Cost Center Approval':
    case 'Pending Department Approval':
    case 'Pending Finance Approval':
      instanceStatus = 'InProgress';
      startedAt = requisition.submittedAt || new Date();
      break;
    case 'Approved':
      instanceStatus = 'Approved';
      startedAt = requisition.submittedAt || new Date();
      completedAt = new Date(); // Use current date if we don't have it
      break;
    case 'Rejected':
      instanceStatus = 'Rejected';
      startedAt = requisition.submittedAt || new Date();
      completedAt = new Date();
      break;
    case 'Returned':
      instanceStatus = 'Returned';
      startedAt = requisition.submittedAt || new Date();
      break;
    default:
      instanceStatus = 'NotStarted';
  }
  
  // Create the approval instance
  const approvalInstance = await ApprovalInstance.create({
    instanceId,
    requisitionId: requisition._id,
    workflowId: workflow._id,
    currentStageIndex: Math.min(currentStageIndex, approvalStages.length - 1),
    status: instanceStatus,
    approvals: approvalStages,
    tenantId: requisition.tenantId,
    startedAt,
    completedAt
  });
  
  // Update the requisition with the instance ID
  await Requisition.updateOne(
    { _id: requisition._id },
    { approvalInstanceId: instanceId }
  );
  
  return approvalInstance;
};

/**
 * Main migration function
 */
const migrateRequisitions = async () => {
  try {
    // Find all requisitions that are in workflow
    const requisitions = await Requisition.find({
      status: { 
        $in: [
          'Pending Approval', 
          'Pending Cost Center Approval', 
          'Pending Department Approval',
          'Pending Finance Approval',
          'Approved',
          'Rejected',
          'Returned'
        ]
      },
      approvalInstanceId: { $exists: false } // Only those without instances
    });
    
    console.log(`Found ${requisitions.length} requisitions to migrate`);
    
    // Create approval instances for each
    let count = 0;
    for (const requisition of requisitions) {
      try {
        await createApprovalInstanceFromRequisition(requisition);
        count++;
        console.log(`Processed ${count}/${requisitions.length}: ${requisition._id}`);
      } catch (err) {
        console.error(`Error processing requisition ${requisition._id}:`, err);
      }
    }
    
    console.log(`Successfully migrated ${count}/${requisitions.length} requisitions`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

// Run the migration
migrateRequisitions();
