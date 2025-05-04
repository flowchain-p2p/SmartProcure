const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  // New fields for category relationship
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
    // Will become required: true after migration
  },
  categoryPath: {
    type: [String]
    // Will become required: true after migration
  },
  description: {
    type: String,
    required: true
  },
  discount: {
    type: Number,
    required: true
  },
  images: {
    type: [String],
    required: true
  },
  inStock: {
    type: Boolean,
    required: true
  },
  isPopular: {
    type: Boolean,
    required: true
  },
  mrp: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  partNumber: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  ratings: {
    average: {
      type: mongoose.Schema.Types.Decimal128,
      required: true
    },
    count: {
      type: Number,
      required: true
    }
  },
  shortDescription: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  specifications: {
    Adjustable: { type: String },
    'Breaking Capacity': { type: String },
    'Case Included': { type: String },
    Certification: { type: String },
    'Chuck Size': { type: String },
    'Current Rating': { type: String },
    Design: { type: String },
    Features: { type: String },
    'Filter Type': { type: String },
    'Filters Included': { type: String },
    Filtration: { type: String },
    Finish: { type: String },
    Includes: { type: String },
    Insulation: { type: String },
    Length: { type: String },
    Material: { type: String },
    'Max Torque': { type: String },
    'Motor Type': { type: String },
    Mounting: { type: String },
    'No-load Speed': { type: String },
    Pieces: { type: String },
    Poles: { type: String },
    Power: { type: String },
    'Protection Type': { type: String },
    Quantity: { type: String },
    Reusable: { type: String },
    Size: { type: String },
    'Socket Type': { type: String },
    'Speed Settings': { type: String },
    Standards: { type: String },
    'Trip Curve': { type: String },
    Type: { type: String },
    Valve: { type: String },
    Voltage: { type: String },
    'Voltage Rating': { type: String },
    Warranty: { type: String },
    Weight: { type: String },
    'Wheel Diameter': { type: String }
  },
  stockQuantity: {
    type: Number,
    required: true
  },
  subCategory: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
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
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add indexes for category queries
ProductSchema.index({ tenantId: 1, categoryId: 1 });
ProductSchema.index({ tenantId: 1, categoryPath: 1 });

module.exports = mongoose.model('Product', ProductSchema);
