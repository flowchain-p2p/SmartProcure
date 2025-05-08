const mongoose = require('mongoose');

// Schema for RFQ Items
const RFQItemSchema = new mongoose.Schema({
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
  unitOfMeasure: {
    type: String,
    required: true,
    trim: true
  },
  estimatedUnitPrice: {
    type: Number,
    min: 0
  },
  estimatedTotalPrice: {
    type: Number,
    min: 0
  },
  requisitionItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RequisitionItem'
  },
  notes: {
    type: String,
    trim: true
  },
  attachments: {
    type: [String]
  }
});

// Schema for Vendor Quotes
const VendorQuoteSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  responsedAt: {
    type: Date
  },
  quoteSubmittedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Invited', 'Declined', 'Responded', 'Selected'],
    default: 'Invited'
  },
  totalQuoteAmount: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  deliveryDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  attachments: {
    type: [String]
  },
  // Items quoted by this vendor
  itemQuotes: [{
    rfqItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
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
    alternativeDescription: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    attachments: {
      type: [String]
    }
  }]
});

const RFQSchema = new mongoose.Schema({
  rfqNumber: {
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
  },  status: {
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
  },  // Reference to the originating requisition
  requisitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Requisition',
    required: true
    // Removed index: true as it's defined in schema.index() below
  },
  // RFQ items
  items: [RFQItemSchema],
  // Vendors invited to quote
  vendorQuotes: [VendorQuoteSchema],
  // The vendor who was awarded this RFQ
  awardedVendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    index: true
  },
  awardedAt: {
    type: Date
  },
  awardedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Related purchase order (if created)
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  },
  // Deadline for vendor responses
  submissionDeadline: {
    type: Date,
    required: true
  },
  // Total estimated amount based on requisition
  estimatedTotalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'INR'
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
  openedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  openedAt: {
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
RFQSchema.index({ tenantId: 1, rfqNumber: 1 });
RFQSchema.index({ tenantId: 1, status: 1 });
RFQSchema.index({ tenantId: 1, createdBy: 1 });
RFQSchema.index({ requisitionId: 1 });
RFQSchema.index({ 'vendorQuotes.vendorId': 1 });

// Pre-save middleware to update 'updatedAt' on save
RFQSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RFQ', RFQSchema);
