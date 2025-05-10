const mongoose = require('mongoose');

const RequisitionSchema = new mongoose.Schema({
  requisitionNumber: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  requisitionType: {
    type: String,
    enum: ['catalogItem', 'customItem'],
    default: 'catalogItem' // Default to catalog item initially
  },
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Submitted', 'Pending Approval', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Draft'
  },
  // New fields for simplified approval process
  approvers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    level: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    comments: String,
    actionDate: Date
  }],
  currentApprovalLevel: {
    type: Number,
    default: 1
  },
  approvalStatus: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Approved', 'Rejected'],
    default: 'Not Started'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false,
    default: null // Making it truly optional with a default value
  },
  costCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CostCenter'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },  // The following fields are kept for basic approval information
  submittedAt: {
    type: Date
  },
  approvalStage: {
    type: String,
    enum: ['Not Started', 'Cost Center', 'Department', 'Finance', 'Complete'],
    default: 'Not Started'
  },  department: {
    type: String,
    trim: true
  },
  categoryName: {
    type: String,
    trim: true
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'INR'
  },
  deliveryDate: {
    type: Date
  },
  notes: {
    type: String
  },
  attachments: {
    type: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster lookups
RequisitionSchema.index({ tenantId: 1, requisitionNumber: 1 });
RequisitionSchema.index({ tenantId: 1, createdBy: 1 });
RequisitionSchema.index({ tenantId: 1, status: 1 });

// Pre-save middleware to update 'updatedAt' on save
RequisitionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for getting requisition items
RequisitionSchema.virtual('items', {
  ref: 'RequisitionItem',
  localField: '_id',
  foreignField: 'requisitionId',
  justOne: false
});

// No approval history needed for MVP

module.exports = mongoose.model('Requisition', RequisitionSchema);
