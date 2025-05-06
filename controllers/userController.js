const User = require('../models/User');
const Location = require('../models/Location');
const Tenant = require('../models/Tenant');

/**
 * @desc    Get all users for a tenant
 * @route   GET /api/v1/tenants/:tenantSlug/users
 * @access  Private
 */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.tenant.id });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/v1/tenants/:tenantSlug/users/:id
 * @access  Private
 */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * @desc    Create new user
 * @route   POST /api/v1/tenants/:tenantSlug/users
 * @access  Private
 */
exports.createUser = async (req, res) => {
  try {
    // Add tenant ID to the user
    req.body.tenantId = req.tenant.id;

    // Check if user with this email already exists for this tenant
    const existingUser = await User.findOne({
      email: req.body.email,
      tenantId: req.tenant.id
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // If no default location is specified, assign the tenant's default location
    if (!req.body.defaultLocationId) {
      const tenant = await require('../models/Tenant').findById(req.tenant.id);
      if (tenant && tenant.defaultLocationId) {
        req.body.defaultLocationId = tenant.defaultLocationId;
        
        // Also add to preferred locations
        if (!req.body.preferredLocations) {
          req.body.preferredLocations = [tenant.defaultLocationId];
        } else if (!req.body.preferredLocations.includes(tenant.defaultLocationId.toString())) {
          req.body.preferredLocations.push(tenant.defaultLocationId);
        }
      }
    }

    const user = await User.create(req.body);

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/v1/tenants/:tenantSlug/users/:id
 * @access  Private
 */
exports.updateUser = async (req, res) => {
  try {
    let user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password from update if it's empty
    if (req.body.password === '') {
      delete req.body.password;
    }
    
    // If password is being updated, hash it properly
    if (req.body.password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/tenants/:tenantSlug/users/:id
 * @access  Private
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Use findByIdAndDelete instead of the deprecated remove() method
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    console.error(`User ID: ${req.params.id}, Tenant ID: ${req.tenant.id}`);
    
    res.status(500).json({
      success: false,
      message: 'Server Error: ' + error.message
    });
  }
};

/**
 * @desc    Set user's default location
 * @route   PUT /api/v1/users/:id/defaultLocation
 * @access  Private
 */
exports.setUserDefaultLocation = async (req, res) => {
  try {
    // Get user and validate it belongs to tenant
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if the location exists and belongs to the tenant
    const location = await Location.findOne({
      _id: req.body.locationId,
      tenantId: req.tenant._id
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found or does not belong to your tenant'
      });
    }

    // Update user's default location
    user.defaultLocationId = location._id;
    
    // If the location is not in preferred locations, add it
    if (!user.preferredLocations.includes(location._id)) {
      user.preferredLocations.push(location._id);
    }
    
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: `Default location set to ${location.code}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: ' + error.message
    });
  }
};

/**
 * @desc    Manage user's preferred locations (add/remove)
 * @route   PUT /api/v1/users/:id/locations
 * @access  Private
 */
exports.manageUserLocations = async (req, res) => {
  try {
    // Validate request body
    if (!req.body.locations || !Array.isArray(req.body.locations)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of location IDs'
      });
    }

    // Find user
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify all locations exist and belong to the tenant
    const locationIds = req.body.locations;
    const validLocations = await Location.find({
      _id: { $in: locationIds },
      tenantId: req.tenant._id
    });

    if (validLocations.length !== locationIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more locations are invalid or do not belong to your tenant'
      });
    }

    // Update user's preferred locations
    user.preferredLocations = locationIds;
    
    // If the default location is not in the preferred locations, update it
    if (user.defaultLocationId && !locationIds.includes(user.defaultLocationId.toString())) {
      // Set the first preferred location as default if available
      user.defaultLocationId = locationIds.length > 0 ? locationIds[0] : null;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: ' + error.message
    });
  }
};

/**
 * @desc    Get user's locations
 * @route   GET /api/v1/users/:id/locations
 * @access  Private
 */
exports.getUserLocations = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    }).populate('preferredLocations defaultLocationId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        defaultLocation: user.defaultLocationId,
        preferredLocations: user.preferredLocations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: ' + error.message
    });
  }
};
