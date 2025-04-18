const mongoose = require('mongoose');

const catalogItemSchema = new mongoose.Schema({
  name: {
    type: String, 
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: String,
  category: {
    type: String,
    required: true,
    index: true
  },
  subCategory: {
    type: String,
    index: true
  },
  brand: {
    type: String,
    index: true
  },
  price: {
    type: Number,
    required: true,
    index: true
  },
  mrp: Number, // Maximum retail price
  discount: Number, // Percentage discount
  tags: {
    type: [String],
    index: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  partNumber: String,
  specifications: {
    type: Map,
    of: String
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  inStock: {
    type: Boolean,
    default: true,
    index: true
  },
  isPopular: {
    type: Boolean,
    default: false,
    index: true
  },
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  images: [String],
  thumbnailUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Text index for search
catalogItemSchema.index(
  { name: 'text', description: 'text', tags: 'text', brand: 'text' },
  { weights: { name: 10, brand: 8, tags: 5, description: 3 } }
);

// Compound indexes for common queries
catalogItemSchema.index({ category: 1, price: 1 });
catalogItemSchema.index({ brand: 1, category: 1 });
catalogItemSchema.index({ isPopular: 1, category: 1 });

const CatalogItem = mongoose.model('CatalogItem', catalogItemSchema);

module.exports = CatalogItem;
