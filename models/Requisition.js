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
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Draft'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false,
    default: null // Making it truly optional with a default value
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  department: {
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

module.exports = mongoose.model('Requisition', RequisitionSchema);
