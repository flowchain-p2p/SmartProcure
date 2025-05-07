const mongoose = require('mongoose');

const ApprovalInstanceSchema = new mongoose.Schema({
  // Format: "approvalInstance-{requisitionId}"
  instanceId: {
    type: String,
    required: true,
    unique: true
  },
  // Reference to the business object (requisition)
  requisitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Requisition',
    required: true,
    index: true
  },
  // Reference to the workflow template
  workflowId: {
    type: String,
    required: true
  },
  // Current stage in the workflow
  currentStageIndex: {
    type: Number,
    default: 0
  },
  // Overall status of this approval instance
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Pending Approval', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Draft'
  },
  // Approval stages with their approvers and status
  approvals: [{
    stage: {
      type: String,
      required: true
    },
    stageOrder: {
      type: Number,
      required: true
    },
    approvers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        required: true
      },
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Returned', 'Cancelled'],
        default: 'Pending'
      },
      comments: String,
      actionDate: Date
    }]
  }],
  // When this instance was created
  createdAt: {
    type: Date,
    default: Date.now
  },
  // When this instance was last updated
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // When the approval process was started
  startedAt: {
    type: Date
  },
  // When the approval process was completed (approved/rejected)
  completedAt: {
    type: Date
  },
  // Tenant ID for data isolation
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  }
});

// Pre-save middleware to update 'updatedAt' on save
ApprovalInstanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for faster lookups
ApprovalInstanceSchema.index({ requisitionId: 1, tenantId: 1 });
// We don't need to create this index since it's already defined with unique: true in the schema
// ApprovalInstanceSchema.index({ instanceId: 1 });
ApprovalInstanceSchema.index({ 'approvals.approvers.userId': 1 });
ApprovalInstanceSchema.index({ status: 1, tenantId: 1 });

module.exports = mongoose.model('ApprovalInstance', ApprovalInstanceSchema);
