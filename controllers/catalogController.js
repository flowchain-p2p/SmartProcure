const Category = require('../models/Category');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { 
  getCategoriesByTenant, 
  getChildCategories,
  getCategoryById
} = require('../utils/categoryUtils');

// @desc    Get all catalogs (root categories at level 0)
// @route   GET /api/v1/catalogs
// @access  Private
const getCatalogs = async (req, res) => {
  try {
    // Fetch only root categories (level 0)
    const catalogs = await Category.find({ 
      tenantId: req.tenant.id,
      level: 0
    }).sort('name');
    
    res.status(200).json({
      success: true,
      count: catalogs.length,
      data: catalogs
    });
  } catch (error) {
    console.error('Error fetching catalogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching catalogs',
      error: error.message
    });
  }
};

// @desc    Get sub-catalogs (child categories) for a specific catalog
// @route   GET /api/v1/catalogs/:id/subcatalogs
// @access  Private
const getSubcatalogs = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid catalog ID format'
      });
    }
    
    // Verify parent category exists and belongs to tenant
    const parentCategory = await getCategoryById(req.params.id);
    
    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: 'Catalog not found'
      });
    }
    
    if (parentCategory.tenantId.toString() !== req.tenant.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this catalog'
      });
    }
    
    const subcatalogs = await getChildCategories(req.params.id);
    
    res.status(200).json({
      success: true,
      count: subcatalogs.length,
      data: subcatalogs
    });
  } catch (error) {
    console.error('Error fetching subcatalogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subcatalogs',
      error: error.message
    });
  }
};

// @desc    Get all distinct brands in products
// @route   GET /api/v1/brands
// @access  Private
const getBrands = async (req, res) => {
  try {
    const query = { tenantId: req.tenant.id };
    
    // Optional category filter
    if (req.query.categoryId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID format'
        });
      }
      
      query.categoryId = req.query.categoryId;
    }
    
    // Find distinct brands
    const brands = await Product.distinct('brand', query);
    
    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brands',
      error: error.message
    });
  }
};

// @desc    Search products by name
// @route   GET /api/v1/products/search
// @access  Private
const searchProductsByName = async (req, res) => {
  try {
    const query = { tenantId: req.tenant.id };
    
    if (req.query.name) {
      query.name = { $regex: req.query.name, $options: 'i' };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Name search parameter is required'
      });
    }
    
    // Optional filters
    if (req.query.categoryId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID format'
        });
      }
      query.categoryId = req.query.categoryId;
    }
    
    if (req.query.brand) {
      query.brand = req.query.brand;
    }
    
    // Support pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });
    
    const total = await Product.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: products
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
};

module.exports = {
  getCatalogs,
  getSubcatalogs,
  getBrands,
  searchProductsByName
};
