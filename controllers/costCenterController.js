const CostCenter = require('../models/CostCenter');

/**
 * @desc    Get all cost centers for a tenant
 * @route   GET /api/v1/tenants/:tenantSlug/cost-centers
 * @access  Private
 */
exports.getCostCenters = async (req, res) => {
  try {
    const costCenters = await CostCenter.find({
      tenantId: req.tenant.id
    });

    res.status(200).json({
      success: true,
      count: costCenters.length,
      data: costCenters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * @desc    Get single cost center
 * @route   GET /api/v1/tenants/:tenantSlug/cost-centers/:id
 * @access  Private
 */
exports.getCostCenter = async (req, res) => {
  try {
    // Check if populate query parameter exists
    const { populate } = req.query;
    let query = CostCenter.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    // Handle populate parameter if provided
    if (populate) {
      const fieldsToPopulate = populate.split(',');
      
      // Process each field to populate
      fieldsToPopulate.forEach(field => {
        if (field.includes('.')) {
          // Handle nested populate (e.g., approvers.userId)
          const [parentField, childField] = field.split('.');
          query = query.populate({
            path: parentField,
            populate: { path: childField }
          });
        } else {
          // Handle direct populate (e.g., head)
          query = query.populate(field);
        }
      });
    }

    // Execute the query
    const costCenter = await query;

    if (!costCenter) {
      return res.status(404).json({
        success: false,
        message: 'Cost center not found'
      });
    }

    res.status(200).json({
      success: true,
      data: costCenter
    });
  } catch (error) {
    console.error('Error fetching cost center:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * @desc    Create new cost center
 * @route   POST /api/v1/tenants/:tenantSlug/cost-centers
 * @access  Private
 */
exports.createCostCenter = async (req, res) => {
  try {
    req.body.tenantId = req.tenant.id;
    const costCenter = await CostCenter.create(req.body);

    res.status(201).json({
      success: true,
      data: costCenter
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update cost center
 * @route   PUT /api/v1/tenants/:tenantSlug/cost-centers/:id
 * @access  Private
 */
exports.updateCostCenter = async (req, res) => {
  try {
    let costCenter = await CostCenter.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!costCenter) {
      return res.status(404).json({
        success: false,
        message: 'Cost center not found'
      });
    }

    costCenter = await CostCenter.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: costCenter
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete cost center
 * @route   DELETE /api/v1/tenants/:tenantSlug/cost-centers/:id
 * @access  Private
 */
exports.deleteCostCenter = async (req, res) => {
  try {
    const costCenter = await CostCenter.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!costCenter) {
      return res.status(404).json({
        success: false,
        message: 'Cost center not found'
      });
    }

    await costCenter.remove();

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

/**
 * @desc    Get single cost center directly (without tenant in URL)
 * @route   GET /api/v1/cost-centers/:id
 * @access  Private
 */
exports.getCostCenterDirect = async (req, res) => {
  try {
    // Check if populate query parameter exists
    const { populate } = req.query;
    let query = CostCenter.findOne({
      _id: req.params.id
    });

    // Handle populate parameter if provided
    if (populate) {
      const fieldsToPopulate = populate.split(',');
      
      // Process each field to populate
      fieldsToPopulate.forEach(field => {
        if (field.includes('.')) {
          // Handle nested populate (e.g., approvers.userId)
          const [parentField, childField] = field.split('.');
          query = query.populate({
            path: parentField,
            populate: { path: childField }
          });
        } else {
          // Handle direct populate (e.g., head)
          query = query.populate(field);
        }
      });
    }

    // Execute the query
    const costCenter = await query;

    if (!costCenter) {
      return res.status(404).json({
        success: false,
        message: 'Cost center not found'
      });
    }

    res.status(200).json({
      success: true,
      data: costCenter
    });
  } catch (error) {
    console.error('Error fetching cost center:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
