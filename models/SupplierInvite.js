const mongoose = require('mongoose');

const SupplierInviteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
    default: 'pending'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Index for faster lookups
SupplierInviteSchema.index({ token: 1 });
SupplierInviteSchema.index({ email: 1, tenantId: 1 });

module.exports = mongoose.model('SupplierInvite', SupplierInviteSchema);
