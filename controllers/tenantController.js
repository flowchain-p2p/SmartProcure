const Tenant = require('../models/Tenant');
const User = require('../models/User');

const { sendTokenResponse } = require('../utils/authUtils');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new organization
 * @route   POST /api/v1/tenants
 * @access  Public
 */
exports.createTenant = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, slug, adminEmail, adminPassword } = req.body;    // Check if organization with this slug already exists
    const existingTenant = await Tenant.findOne({ slug: slug.toLowerCase() });

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        error: 'Organization with this slug already exists'
      });
    }    // Create organization
    const tenant = await Tenant.create({
      name,
      slug: slug.toLowerCase(),
      adminEmail,
      adminPassword
    });    // Create admin user for this organization
    const adminUser = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      tenantId: tenant._id
    });

    sendTokenResponse(adminUser, 201, res);
  } catch (error) {
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
  try {
    const tenants = await Tenant.find().select('-adminPassword');
    
    res.status(200).json({
      success: true,
      count: tenants.length,
      data: tenants
    });
  } catch (error) {
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
exports.getTenant = async (req, res) => {  try {
    const tenant = await Tenant.findById(req.params.id).select('-adminPassword');
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
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
  try {
    // Only return active tenants with limited information
    const publicTenants = await Tenant.find({ active: true })
      .select('name slug createdAt')
      .lean();
    
    res.status(200).json({
      success: true,
      count: publicTenants.length,
      data: publicTenants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};