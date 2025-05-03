const UnitOfMeasure = require('../models/UnitOfMeasure');

// @desc    Get all units of measure for the current tenant
// @route   GET /api/v1/uom
// @access  Private
const getUnitsOfMeasure = async (req, res) => {
  try {
    const query = { tenantId: req.tenant.id };
    
    // Support filtering by category
    if (req.query.category) query.category = req.query.category;
    
    // Support pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const units = await UnitOfMeasure.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ category: 1, name: 1 });
    
    const total = await UnitOfMeasure.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: units.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: units
    });
  } catch (error) {
    console.error('Error fetching units of measure:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching units of measure',
      error: error.message
    });
  }
};

// @desc    Get a single unit of measure by ID
// @route   GET /api/v1/uom/:id
// @access  Private
const getUnitOfMeasure = async (req, res) => {
  try {
    const unit = await UnitOfMeasure.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });
    
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit of measure not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: unit
    });
  } catch (error) {
    console.error('Error fetching unit of measure:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unit of measure',
      error: error.message
    });
  }
};

// @desc    Create a new unit of measure
// @route   POST /api/v1/uom
// @access  Private
const createUnitOfMeasure = async (req, res) => {
  try {
    // Add the tenant ID from the authenticated request
    const unitData = {
      ...req.body,
      tenantId: req.tenant.id
    };
    
    const unit = await UnitOfMeasure.create(unitData);
    
    res.status(201).json({
      success: true,
      data: unit
    });
  } catch (error) {
    console.error('Error creating unit of measure:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A unit of measure with this symbol already exists for this tenant'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating unit of measure',
      error: error.message
    });
  }
};

// @desc    Update a unit of measure
// @route   PUT /api/v1/uom/:id
// @access  Private
const updateUnitOfMeasure = async (req, res) => {
  try {
    let unit = await UnitOfMeasure.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });
    
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit of measure not found'
      });
    }
    
    unit = await UnitOfMeasure.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: unit
    });
  } catch (error) {
    console.error('Error updating unit of measure:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A unit of measure with this symbol already exists for this tenant'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating unit of measure',
      error: error.message
    });
  }
};

// @desc    Delete a unit of measure
// @route   DELETE /api/v1/uom/:id
// @access  Private
const deleteUnitOfMeasure = async (req, res) => {
  try {
    const unit = await UnitOfMeasure.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenant.id
    });
    
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit of measure not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting unit of measure:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting unit of measure',
      error: error.message
    });
  }
};

module.exports = {
  getUnitsOfMeasure,
  getUnitOfMeasure,
  createUnitOfMeasure,
  updateUnitOfMeasure,
  deleteUnitOfMeasure
};
