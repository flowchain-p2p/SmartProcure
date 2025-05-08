const mongoose = require('mongoose');

const SupplierOrderSchema = new mongoose.Schema({
  orderId: { 
    type: String, 
    required: [true, 'Please provide an order ID'],
    trim: true,
    index: true
  },
  customerName: { 
    type: String, 
    required: [true, 'Please provide a customer name'],
    trim: true 
  },
  orderType: { 
    type: String, 
    enum: ['Quote', 'PO'], 
    required: [true, 'Please provide an order type'] 
  },
  date: { 
    type: Date, 
    required: [true, 'Please provide an order date'],
    default: Date.now 
  },
  status: {
    type: String,
    enum: ['Requested', 'Accepted', 'Rejected', 'In Delivery', 'Delivered'],
    required: [true, 'Please provide an order status'],
    default: 'Requested'
  },
  vendorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vendor',
    required: [true, 'Please provide a vendor ID'],
    index: true
  },
  quote: {
    unitPrice: Number,
    taxes: Number,
    deliveryDate: Date,
    terms: String,
    notes: String,
    submittedAt: Date
  },
  poDetails: {
    accepted: Boolean,
    estimatedDeliveryDate: Date,
    poFileUrl: String
  },
  deliveryStatus: {
    currentStatus: {
      type: String,
      enum: ['Not Started', 'In Transit', 'Delivered', 'Delayed'],
      default: 'Not Started'
    },
    invoiceUrl: String,
    trackingInfo: String,
    updatedAt: Date
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
}, {
  timestamps: true
});

// Pre-save middleware to update 'updatedAt' on save
SupplierOrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a compound index for tenant and orderId to ensure uniqueness within a tenant
SupplierOrderSchema.index({ tenantId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model('SupplierOrder', SupplierOrderSchema);
