const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a vendor name'],
    trim: true
  },
  code: {
    type: String,
    trim: true,
    index: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    }
  },
  website: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    trim: true
  },  paymentTerms: {
    type: String,
    trim: true
  },
  // The category field is now handled through the VendorCategory relationship model
  // This field is kept for backwards compatibility but is deprecated
  category: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending', 'Blacklisted'],
    default: 'Active'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  isPreferred: {
    type: Boolean,
    default: false
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true // For faster lookups
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
VendorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a compound index for tenant and code to ensure uniqueness within a tenant
VendorSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Vendor', VendorSchema);
