const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },  code: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  permissions: [{
    type: String,  // Store permission codes directly
    ref: 'Permission'
  }],
  inheritsFrom: {
    type: String,
    ref: 'Role',
    default: null
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
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

// Pre-save middleware to update 'updatedAt' on save
RoleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a compound index on code and tenantId to ensure uniqueness per tenant
RoleSchema.index({ code: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.model('Role', RoleSchema);
