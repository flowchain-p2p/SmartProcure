const mongoose = require('mongoose');

/**
 * VendorCategory Schema - Represents the many-to-many relationship between vendors and categories
 * A vendor can supply multiple categories, and a category can be supplied by multiple vendors
 */
const VendorCategorySchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true // For faster lookups
  },
  // Additional fields that describe the relationship
  preferredSupplier: {
    type: Boolean,
    default: false
  },
  priceRange: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  notes: {
    type: String,
    trim: true
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
VendorCategorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index to ensure a vendor can only be associated with a category once per tenant
VendorCategorySchema.index(
  { vendorId: 1, categoryId: 1, tenantId: 1 },
  { unique: true }
);

// Additional indexes for faster lookups
VendorCategorySchema.index({ vendorId: 1, tenantId: 1 });
VendorCategorySchema.index({ categoryId: 1, tenantId: 1 });

module.exports = mongoose.model('VendorCategory', VendorCategorySchema);
