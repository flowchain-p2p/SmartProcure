const mongoose = require('mongoose');

const RequisitionItemSchema = new mongoose.Schema({
  requisitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Requisition',
    required: true
  },
  // Fields for catalog-based items
  catalogProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  // Fields for free-text items
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Common fields for both catalog and free-text items
  vendorName: {
    type: String,
    trim: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor' // Assuming there might be a Vendor model in the future
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, 'Quantity must be greater than 0']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  // Using UnitOfMeasure model for unit
  unit: {
    type: String,
    required: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnitOfMeasure'
  },
  totalPrice: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'INR'
  },
  estimatedDeliveryDate: {
    type: Date
  },
  notes: {
    type: String
  },
  itemStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
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

// Indexes for faster lookups
RequisitionItemSchema.index({ requisitionId: 1 });
RequisitionItemSchema.index({ tenantId: 1, catalogProductId: 1 });

// Pre-validate middleware to calculate totalPrice before validation runs
RequisitionItemSchema.pre('validate', function(next) {
  // Calculate total price based on quantity and unitPrice
  this.totalPrice = this.quantity * this.unitPrice;
  
  next();
});

// Pre-save middleware to update 'updatedAt' and validate fields
RequisitionItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Validation to ensure either catalog product or free-text fields are provided
  if (!this.catalogProductId && !this.name) {
    const error = new Error('Either catalogProductId or name must be provided');
    return next(error);
  }
  
  next();
});

// Post-save hook to update the total amount in the parent Requisition
RequisitionItemSchema.post('save', async function() {
  try {
    const Requisition = mongoose.model('Requisition');
    
    // Get all items for this requisition
    const items = await this.constructor.find({ requisitionId: this.requisitionId });
    
    // Calculate the total amount
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Update the requisition's total amount
    await Requisition.findByIdAndUpdate(
      this.requisitionId, 
      { totalAmount },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating requisition total amount:', error);
  }
});

// Similar post hooks for removal and update operations
RequisitionItemSchema.post('remove', async function() {
  try {
    const Requisition = mongoose.model('Requisition');
    
    // Get all remaining items for this requisition
    const items = await this.constructor.find({ requisitionId: this.requisitionId });
    
    // Calculate the new total amount
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Update the requisition's total amount
    await Requisition.findByIdAndUpdate(
      this.requisitionId, 
      { totalAmount },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating requisition total amount after remove:', error);
  }
});

module.exports = mongoose.model('RequisitionItem', RequisitionItemSchema);
