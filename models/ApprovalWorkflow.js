const mongoose = require('mongoose');

const ApprovalWorkflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  type: {
    type: String,
    enum: ['requisition', 'purchase', 'invoice'],
    required: true
  },
  thresholds: [{
    amount: Number,
    requiredApprovals: [{
      role: String,
      level: Number
    }]
  }],
  costCenterOverrides: [{
    costCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CostCenter'
    },
    approvers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      level: Number
    }]
  }]
});

module.exports = mongoose.model('ApprovalWorkflow', ApprovalWorkflowSchema);
