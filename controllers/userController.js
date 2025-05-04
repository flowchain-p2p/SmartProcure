const User = require('../models/User');

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

    await user.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
