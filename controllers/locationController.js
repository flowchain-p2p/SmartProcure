const Location = require('../models/Location');
const Tenant = require('../models/Tenant');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all locations for a tenant
// @route   GET /api/v1/locations
// @access  Private
exports.getLocations = asyncHandler(async (req, res, next) => {
  // Get tenant ID from request (added by tenant middleware)
  const tenantId = req.tenant._id;
  
  const locations = await Location.find({ tenantId });

  res.status(200).json({
    success: true,
    count: locations.length,
    data: locations
  });
});

// @desc    Get single location
// @route   GET /api/v1/locations/:id
// @access  Private
exports.getLocation = asyncHandler(async (req, res, next) => {
  const tenantId = req.tenant._id;
  
  const location = await Location.findOne({ 
    _id: req.params.id, 
    tenantId 
  });

  if (!location) {
    return next(new ErrorResponse(`Location not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: location
  });
});

// @desc    Create new location
// @route   POST /api/v1/locations
// @access  Private (Admin only)
exports.createLocation = asyncHandler(async (req, res, next) => {
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
});

// @desc    Update location
// @route   PUT /api/v1/locations/:id
// @access  Private (Admin only)
exports.updateLocation = asyncHandler(async (req, res, next) => {
  const tenantId = req.tenant._id;
  
  let location = await Location.findOne({ 
    _id: req.params.id, 
    tenantId 
  });

  if (!location) {
    return next(new ErrorResponse(`Location not found with id of ${req.params.id}`, 404));
  }

  location = await Location.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: location
  });
});

// @desc    Delete location
// @route   DELETE /api/v1/locations/:id
// @access  Private (Admin only)
exports.deleteLocation = asyncHandler(async (req, res, next) => {
  const tenantId = req.tenant._id;
  
  const location = await Location.findOne({ 
    _id: req.params.id, 
    tenantId 
  });

  if (!location) {
    return next(new ErrorResponse(`Location not found with id of ${req.params.id}`, 404));
  }
  
  // Check if the location is the tenant's default location
  const tenant = await Tenant.findById(tenantId);
  if (tenant.defaultLocationId && tenant.defaultLocationId.toString() === req.params.id) {
    return next(new ErrorResponse(`Cannot delete default location. Set another location as default first.`, 400));
  }

  await location.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Set location as default for tenant
// @route   PUT /api/v1/locations/:id/default
// @access  Private (Admin only)
exports.setDefaultLocation = asyncHandler(async (req, res, next) => {
  const tenantId = req.tenant._id;
  
  const location = await Location.findOne({ 
    _id: req.params.id, 
    tenantId 
  });

  if (!location) {
    return next(new ErrorResponse(`Location not found with id of ${req.params.id}`, 404));
  }
  
  // Update tenant's default location
  await Tenant.findByIdAndUpdate(tenantId, { 
    defaultLocationId: location._id 
  });

  res.status(200).json({
    success: true,
    message: `Location ${location.code} set as default for tenant`
  });
});
