const mongoose = require('mongoose');

const RequisitionItemSchema = new mongoose.Schema({
  requisitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Requisition',
    required: true
  },
  // Flag to identify catalog vs non-catalog items
  isCatalogItem: {
    type: Boolean,
    default: false
  },
  // Fields for catalog-based items
  catalogProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: function() {
      return this.isCatalogItem === true;
    }
  },
  // Fields for free-text items
  name: {
    type: String,
    trim: true,
    required: function() {
      return this.isCatalogItem === false;
    }
  },
  description: {
    type: String,
    trim: true
  },  // Common fields for both catalog and free-text items
  vendorName: {
    type: String,
    trim: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  preferredVendor: {
    type: Boolean,
    default: false
  },
  categoryName: {
    type: String,
    trim: true
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
  
  // Validation based on item type (catalog vs non-catalog)
  if (this.isCatalogItem && !this.catalogProductId) {
    const error = new Error('Catalog product ID must be provided for catalog items');
    return next(error);
  }
  
  if (!this.isCatalogItem && !this.name) {
    const error = new Error('Name must be provided for non-catalog items');
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
    
    // Determine requisition type based on items
    // If any item is not a catalog item, mark the requisition as customItem
    const hasCustomItem = items.some(item => item.isCatalogItem === false);
    const requisitionType = hasCustomItem ? 'customItem' : 'catalogItem';
    
    // Update the requisition's total amount and requisition type
    await Requisition.findByIdAndUpdate(
      this.requisitionId, 
      { 
        totalAmount,
        requisitionType
      },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating requisition total amount and type:', error);
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
    
    // Determine requisition type based on remaining items
    // If any item is not a catalog item, mark the requisition as customItem
    // If there are no items left, default to catalogItem
    let requisitionType = 'catalogItem'; // Default
    if (items.length > 0) {
      const hasCustomItem = items.some(item => item.isCatalogItem === false);
      requisitionType = hasCustomItem ? 'customItem' : 'catalogItem';
    }
    
    // Update the requisition's total amount and requisition type
    await Requisition.findByIdAndUpdate(
      this.requisitionId, 
      { 
        totalAmount,
        requisitionType
      },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating requisition total amount and type after remove:', error);
  }
});

module.exports = mongoose.model('RequisitionItem', RequisitionItemSchema);
