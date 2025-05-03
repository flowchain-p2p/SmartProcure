const mongoose = require('mongoose');

const UnitOfMeasureSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Please add a symbol'],
    trim: true,
    maxlength: [20, 'Symbol cannot be more than 20 characters']
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    trim: true,
    maxlength: [50, 'Category cannot be more than 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Please add a tenant ID']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create index for faster queries
UnitOfMeasureSchema.index({ tenantId: 1, symbol: 1 }, { unique: true });
UnitOfMeasureSchema.index({ tenantId: 1, category: 1 });

module.exports = mongoose.model('UnitOfMeasure', UnitOfMeasureSchema);
