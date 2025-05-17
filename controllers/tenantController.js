const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const crypto = require('crypto');

const { sendTokenResponse } = require('../utils/authUtils');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new organization
 * @route   POST /api/v1/tenants
 * @access  Public
 */
exports.createTenant = async (req, res) => {
  console.log('[createTenant] Starting tenant creation process');
  try {
    // Log the incoming request body (redacting sensitive information)
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.adminPassword) sanitizedBody.adminPassword = '[REDACTED]';
    console.log('[createTenant] Request body:', JSON.stringify(sanitizedBody));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[createTenant] Validation errors:', JSON.stringify(errors.array()));
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, slug, adminEmail, adminPassword } = req.body;
    console.log(`[createTenant] Processing tenant creation for slug: ${slug}`);
    
    // Check if organization with this slug already exists
    console.log('[createTenant] Checking for existing tenant with slug:', slug);
    const existingTenant = await Tenant.findOne({ slug: slug.toLowerCase() });

    if (existingTenant) {
      console.log('[createTenant] Tenant with slug already exists:', slug);
      return res.status(400).json({
        success: false,
        error: 'Organization with this slug already exists'
      });
    }
    
    // Create organization
    console.log('[createTenant] Creating new tenant with name:', name);
    const tenant = await Tenant.create({
      name,
      slug: slug.toLowerCase(),
      adminEmail,
      adminPassword
    });
    console.log('[createTenant] Tenant created with ID:', tenant._id);
    
    // Create admin user for this organization
    console.log('[createTenant] Creating admin user with email:', adminEmail);
    const adminUser = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      tenantId: tenant._id
    });
    console.log('[createTenant] Admin user created with ID:', adminUser._id);

    console.log('[createTenant] Sending token response');
    sendTokenResponse(adminUser, 201, res);
  } catch (error) {
    console.error('[createTenant] Error creating tenant:', error);
    console.error('[createTenant] Error stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get all organizations
 * @route   GET /api/v1/tenants
 * @access  Private/Admin
 */
exports.getTenants = async (req, res) => {
  console.log('[getTenants] Starting retrieval of all tenants');
  try {
    console.log('[getTenants] Querying database for all tenants');
    const tenants = await Tenant.find().select('-adminPassword');
    
    console.log(`[getTenants] Found ${tenants.length} tenants`);
    if (tenants.length > 0) {
      // Log first tenant as sample (without sensitive info)
      const sampleTenant = tenants[0].toObject();
      delete sampleTenant.adminPassword;
      console.log('[getTenants] Sample tenant:', JSON.stringify(sampleTenant));
    }
    
    res.status(200).json({
      success: true,
      count: tenants.length,
      data: tenants
    });
  } catch (error) {
    console.error('[getTenants] Error retrieving tenants:', error);
    console.error('[getTenants] Error stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get single organization by ID
 * @route   GET /api/v1/tenants/:id
 * @access  Private/Admin
 */
exports.getTenant = async (req, res) => {
  console.log(`[getTenant] Starting retrieval of tenant with ID: ${req.params.id}`);
  try {
    console.log(`[getTenant] Looking up tenant with ID: ${req.params.id}`);
    console.log('[getTenant] Database connection state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected');
    
    const tenant = await Tenant.findById(req.params.id).select('-adminPassword');
    
    if (!tenant) {
      console.log(`[getTenant] No tenant found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    console.log(`[getTenant] Successfully found tenant: ${tenant.name} (${tenant._id})`);
    
    res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error(`[getTenant] Error retrieving tenant with ID ${req.params.id}:`, error);
    console.error('[getTenant] Error stack trace:', error.stack);
    
    // Additional logging for common error types
    if (error.name === 'CastError') {
      console.error('[getTenant] Invalid ID format provided');
    } else if (error.name === 'MongoServerError') {
      console.error('[getTenant] MongoDB server error:', error.code);
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Update tenant
 * @route   PUT /api/v1/tenants/:id
 * @access  Private/Admin
 */
exports.updateTenant = async (req, res) => {
  try {
    let tenant = await Tenant.findById(req.params.id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    // Update fields
    tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-adminPassword');
    
    res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Delete tenant and all associated data
 * @route   DELETE /api/v1/tenants/:id
 * @access  Private/Admin
 */
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    // Delete all associated users
    await User.deleteMany({ tenantId: tenant._id });   
    
    
    // Delete tenant
    await tenant.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get tenant usage statistics
 * @route   GET /api/v1/tenants/:id/stats
 * @access  Private/Admin
 */
exports.getTenantStats = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    // Get statistics
    const userCount = await User.countDocuments({ tenantId: tenant._id });    
    
    
    
    res.status(200).json({
      success: true,
      data: {
        userCount,    
        completionRate: parseFloat(completionRate.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get public tenant information (active tenants only)
 * @route   GET /api/v1/tenants/public
 * @access  Public
 */
exports.getPublicTenants = async (req, res) => {
  console.log('[getPublicTenants] Starting retrieval of public tenants');
  try {
    console.log('[getPublicTenants] Querying database for active tenants');
    console.log('[getPublicTenants] Connection state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected');
    
    // Only return active tenants with limited information
    const publicTenants = await Tenant.find({ active: true })
      .select('name slug createdAt')
      .lean();
    
    console.log(`[getPublicTenants] Found ${publicTenants.length} active public tenants`);
    if (publicTenants.length > 0) {
      console.log('[getPublicTenants] First tenant:', JSON.stringify(publicTenants[0]));
    } else {
      console.log('[getPublicTenants] No active tenants found');
    }
    
    res.status(200).json({
      success: true,
      count: publicTenants.length,
      data: publicTenants
    });
  } catch (error) {
    console.error('[getPublicTenants] Error retrieving public tenants:', error);
    console.error('[getPublicTenants] Error stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};