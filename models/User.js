const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    trim: true,
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  authType: {
    type: String,
    enum: ['local', 'azure', 'okta'],
    default: 'local'
  },
  externalId: { type: String }, // Placeholder for Azure/Okta integration
  costCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CostCenter'
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  position: { type: String },
  approvalLimits: {
    requisition: { type: Number, default: 0 },
    purchase: { type: Number, default: 0 }
  },
  approvalHierarchy: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  roles: {
    type: [String],
    enum: ['Employee', 'Manager', 'CostCenterHead', 'ProcurementTeam', 'Finance', 'Administrator'],
    default: ['Employee']
  },
  roleIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  permissionCache: {
    type: [String],
    default: []
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {  
  const result = await bcrypt.compare(enteredPassword, this.password);
  return result;
};

module.exports = mongoose.model('User', UserSchema);