const mongoose = require('mongoose');

const ApprovalHistorySchema = new mongoose.Schema({
  requisitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Requisition',
    required: true
  },
  actionType: {
    type: String,
    enum: ['Submitted', 'Approved', 'Rejected', 'Returned', 'Cancelled'],
    required: true
  },
  actionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionDate: {
    type: Date,
    default: Date.now
  },
  comments: {
    type: String
  },
  statusFrom: {
    type: String
  },
  statusTo: {
    type: String,
    required: true
  },
  approverRole: {
    type: String
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  }
});

module.exports = mongoose.model('ApprovalHistory', ApprovalHistorySchema);
