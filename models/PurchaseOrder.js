const mongoose = require('mongoose');

const PurchaseOrderItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'INR'
  },
  catalogItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  requisitionItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RequisitionItem'
  },
  rfqItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFQItem'
  },
  unitOfMeasure: {
    type: String,
    trim: true,
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
});

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Issued', 'Delivered', 'Completed', 'Cancelled'],
    default: 'Draft',
    index: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  costCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CostCenter'
  },  // Reference to the originating requisition
  requisitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Requisition',
    required: true
    // Removed index: true as it's defined in schema.index() below
  },
  // Reference to the vendor/supplier
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  // Optional reference to the RFQ if created from an awarded RFQ
  rfqId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFQ',
    index: true
  },
  // PO line items
  items: [PurchaseOrderItemSchema],
  // Total amount of the purchase order
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'INR'
  },
  // Delivery information
  deliveryDate: {
    type: Date,
    required: true
  },
  deliveryAddress: {
    type: String,
    trim: true
  },
  deliveryContact: {
    type: String,
    trim: true
  },
  // Payment terms
  paymentTerms: {
    type: String,
    trim: true
  },
  // Additional fields
  notes: {
    type: String,
    trim: true
  },
  attachments: {
    type: [String]
  },
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  issuedAt: {
    type: Date
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
PurchaseOrderSchema.index({ tenantId: 1, poNumber: 1 });
PurchaseOrderSchema.index({ tenantId: 1, vendorId: 1 });
PurchaseOrderSchema.index({ tenantId: 1, status: 1 });
PurchaseOrderSchema.index({ tenantId: 1, createdBy: 1 });
PurchaseOrderSchema.index({ requisitionId: 1 });

// Pre-save middleware to update 'updatedAt' on save
PurchaseOrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
