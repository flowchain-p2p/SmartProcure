const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ancestors: [
    {      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
      },
      name: {
        type: String,
        required: true
      }
    }
  ],
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    required: true,
    default: 0
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  attributes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

// Index for faster lookups
CategorySchema.index({ tenantId: 1, name: 1 });
CategorySchema.index({ parent: 1 });
CategorySchema.index({ 'ancestors._id': 1 });
CategorySchema.index({ 'ancestors.name': 1 });

// Pre-save middleware to update 'updatedAt' on save
CategorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Category', CategorySchema);
