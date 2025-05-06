const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please provide a location code'],
    trim: true,
    maxlength: [50, 'Location code cannot be more than 50 characters']
  },
  name: {
    type: String,
    required: [true, 'Please provide a location name'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Please provide an address'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'Please provide a city'],
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Please provide a country'],
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true // For faster lookups
  },
  isActive: {
    type: Boolean,
    default: true
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

// Create a compound index for tenant and code to ensure uniqueness within a tenant
LocationSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Location', LocationSchema);
