// filepath: c:\Soundar\Instatenders\multitenent\backend\controllers\rfqController.js
const RFQ = require('../models/RFQ');

// @desc    Get all product catalog items for the current tenant
// @route   GET /api/v1/rfqs
// @access  Private
const getRFQs = async (req, res) => {
  try {
    const query = { tenantId: req.tenant.id };
    
    // Support filtering by category, subCategory, or brand
    if (req.query.category) query.category = req.query.category;
    if (req.query.subCategory) query.subCategory = req.query.subCategory;
    if (req.query.brand) query.brand = req.query.brand;
    if (req.query.inStock) query.inStock = req.query.inStock === 'true';
    if (req.query.isPopular) query.isPopular = req.query.isPopular === 'true';
    
    // Support pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const rfqs = await RFQ.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    const total = await RFQ.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: rfqs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: rfqs
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Get a single RFQ by ID
// @route   GET /api/v1/rfqs/:id
// @access  Private
const getRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rfq
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// @desc    Create a new product catalog item
// @route   POST /api/v1/rfqs
// @access  Private
const createRFQ = async (req, res) => {
  try {
    // Add tenant ID to the request body
    req.body.tenantId = req.tenant.id;
    
    // Set default values if not provided
    if (req.body.stockQuantity > 0 && req.body.inStock === undefined) {
      req.body.inStock = true;
    }
    
    // Calculate price if not provided using MRP and discount
    if (req.body.mrp && req.body.discount && req.body.price === undefined) {
      req.body.price = Math.floor(req.body.mrp - (req.body.mrp * req.body.discount / 100));
    }
    
    // Set default ratings if not provided
    if (!req.body.ratings) {
      req.body.ratings = { average: 0, count: 0 };
    }
    
    const rfq = await RFQ.create(req.body);

    res.status(201).json({
      success: true,
      data: rfq
    });
  } catch (error) {
    console.error('Error creating product catalog item:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating product catalog item',
      error: error.message
    });
  }
};

module.exports = {
  getRFQs,
  getRFQ,
  createRFQ
};
