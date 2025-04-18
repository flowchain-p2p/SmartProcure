const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const TenantSchema = new mongoose.Schema({
  
  allowedDomains: {
    type: [String],
    default: [],
    index: true // For faster lookups
  },
  
  name: {
    type: String,
    required: [true, 'Please provide an organization name'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Organization slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  adminEmail: {
    type: String,
    required: [true, 'Please provide an admin email'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  adminPassword: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  active: {
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

// Encrypt password using bcrypt
TenantSchema.pre('save', async function(next) {
  if (!this.isModified('adminPassword')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.adminPassword = await bcrypt.hash(this.adminPassword, salt);
  next();
});

// Match user entered password to hashed password in database
TenantSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.adminPassword);
};

// Add a helper method to check if domain is allowed for this organization
TenantSchema.methods.isDomainAllowed = function(domain) {
  return this.allowedDomains.includes(domain.toLowerCase());
};

// Static method to find organization by domain
TenantSchema.statics.findByDomain = async function(domain) {
  // First try to find by allowed domains explicitly listed
  const tenantByAllowedDomain = await this.findOne({ 
    allowedDomains: domain.toLowerCase(),
    active: true
  });
  
  if (tenantByAllowedDomain) {
    return tenantByAllowedDomain;
  }
  
  // If not found in allowed domains, extract company name from domain
  // and try to match with tenant slug
  const domainParts = domain.split('.');
  const companySlug = domainParts[0].toLowerCase();
  
  return this.findOne({
    slug: companySlug,
    active: true
  });
};

module.exports = mongoose.model('Tenant', TenantSchema);