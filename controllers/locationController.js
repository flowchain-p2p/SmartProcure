const Location = require('../models/Location');
const Tenant = require('../models/Tenant');
const mongoose = require('mongoose');

// @desc    Get all locations for a tenant
// @route   GET /api/v1/locations
// @access  Private
const getLocations = async (req, res) => {
  try {
    // Get tenant ID from request (added by tenant middleware)
    const tenantId = req.tenant._id;
    
    const locations = await Location.find({ tenantId });

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching locations',
      error: error.message
    });
  }
};

// @desc    Get single location
// @route   GET /api/v1/locations/:id
// @access  Private
const getLocation = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID format'
      });
    }
    
    const tenantId = req.tenant._id;
    
    const location = await Location.findOne({ 
      _id: req.params.id, 
      tenantId 
    });    if (!location) {
      return res.status(404).json({
        success: false,
        message: `Location not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching location',
      error: error.message
    });
  }
};

// @desc    Create new location
// @route   POST /api/v1/locations
// @access  Private (Admin only)
const createLocation = async (req, res) => {
  try {
    // Add tenant id to request body
    req.body.tenantId = req.tenant._id;
    
    const location = await Location.create(req.body);
    
    // If this is the first location for the tenant, set it as default
    const tenant = await Tenant.findById(req.tenant._id);
    if (!tenant.defaultLocationId) {
      tenant.defaultLocationId = location._id;
      await tenant.save();
    }

    res.status(201).json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error creating location:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating location',
      error: error.message
    });
  }
};

// @desc    Update location
// @route   PUT /api/v1/locations/:id
// @access  Private (Admin only)
const updateLocation = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID format'
      });
    }
    
    const tenantId = req.tenant._id;
    
    let location = await Location.findOne({ 
      _id: req.params.id, 
      tenantId 
    });
    if (!location) {
      return res.status(404).json({
        success: false, 
        message: `Location not found with id of ${req.params.id}`
      });
    }

    location = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error updating location:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
};

// @desc    Delete location
// @route   DELETE /api/v1/locations/:id
// @access  Private (Admin only)
const deleteLocation = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID format'
      });
    }
    
    const tenantId = req.tenant._id;
    
    const location = await Location.findOne({ 
      _id: req.params.id, 
      tenantId 
    });
    if (!location) {
      return res.status(404).json({
        success: false,
        message: `Location not found with id of ${req.params.id}`
      });
    }
    
    // Check if the location is the tenant's default location
    const tenant = await Tenant.findById(tenantId);
    if (tenant.defaultLocationId && tenant.defaultLocationId.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete default location. Set another location as default first.`
      });
    }

    await location.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting location',
      error: error.message
    });
  }
};

// @desc    Set location as default for tenant
// @route   PUT /api/v1/locations/:id/default
// @access  Private (Admin only)
const setDefaultLocation = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID format'
      });
    }
    
    const tenantId = req.tenant._id;
    
    const location = await Location.findOne({ 
      _id: req.params.id, 
      tenantId 
    });
    if (!location) {
      return res.status(404).json({
        success: false,
        message: `Location not found with id of ${req.params.id}`
      });
    }
    
    // Update tenant's default location
    await Tenant.findByIdAndUpdate(tenantId, { 
      defaultLocationId: location._id 
    });

    res.status(200).json({
      success: true,
      message: `Location ${location.code} set as default for tenant`
    });
  } catch (error) {
    console.error('Error setting default location:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting default location',
      error: error.message
    });
  }
};

module.exports = {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  setDefaultLocation
};
