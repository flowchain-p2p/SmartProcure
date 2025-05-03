// filepath: c:\Soundar\Instatenders\multitenent\backend\controllers\catalogController.js
const Catalog = require('../models/Catalog');
const Category = require('../models/Category');
const { 
  getCatalogsByCategoryPath, 
  getCatalogsByCategory 
} = require('../utils/categoryUtils');

// @desc    Get all product catalog items for the current tenant
// @route   GET /api/v1/catalogs
// @access  Private
const getCatalogs = async (req, res) => {
  try {
    const query = { tenantId: req.tenant.id };
    
    // Handle category filtering using the new structure
    if (req.query.categoryPath) {
      // Parse the category path from query param (comma-separated)
      const categoryPath = req.query.categoryPath.split(',');
      
      try {
        const catalogs = await getCatalogsByCategoryPath(categoryPath, req.tenant.id);
        
        return res.status(200).json({
          success: true,
          count: catalogs.length,
          data: catalogs
        });
      } catch (error) {
        console.error('Error fetching products by category path:', error);
        return res.status(500).json({
          success: false,
          message: 'Error fetching products by category path',
          error: error.message
        });
      }
    }
    
    if (req.query.categoryId) {
      // If categoryId is provided, get all catalogs in this category
      // and its descendants
      try {
        const catalogs = await getCatalogsByCategory(
          req.query.categoryId, 
          req.tenant.id
        );
        
        return res.status(200).json({
          success: true,
          count: catalogs.length,
          data: catalogs
        });
      } catch (error) {
        console.error('Error fetching products by category ID:', error);
        return res.status(500).json({
          success: false,
          message: 'Error fetching products by category ID',
          error: error.message
        });
      }
    }
    
    // Support legacy filtering for backward compatibility
    if (req.query.category) query.category = req.query.category;
    if (req.query.subCategory) query.subCategory = req.query.subCategory;
    if (req.query.brand) query.brand = req.query.brand;
    if (req.query.inStock) query.inStock = req.query.inStock === 'true';
    if (req.query.isPopular) query.isPopular = req.query.isPopular === 'true';
    
    // Support pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
      const catalogs = await Catalog.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    const total = await Catalog.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: catalogs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: catalogs
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

// @desc    Get a single catalog by ID
// @route   GET /api/v1/catalogs/:id
// @access  Private
const getCatalog = async (req, res) => {
  try {
    const catalog = await Catalog.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });
    
    if (!catalog) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: catalog
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

// @desc    Create a new catalog item
// @route   POST /api/v1/catalogs
// @access  Private
const createCatalog = async (req, res) => {
  try {
    // Add the tenant ID from the authenticated request
    const catalogData = {
      ...req.body,
      tenantId: req.tenant.id
    };
    
    const catalog = await Catalog.create(catalogData);
    
    res.status(201).json({
      success: true,
      data: catalog
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
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
      message: 'Error creating product',
      error: error.message
    });
  }
};

module.exports = {
  getCatalogs,
  getCatalog,
  createCatalog
};
