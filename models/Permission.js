const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },  category: {
    type: String,
    enum: ['PR Management', 'PO Management', 'RFQ Management', 'Budget Management', 'Supplier Management', 'Finance Operations', 'System Administration'],
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
  }
});

module.exports = mongoose.model('Permission', PermissionSchema);
