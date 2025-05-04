const Product = require('../models/Product');
const Category = require('../models/Category');
const { 
  getProductsByCategoryPath, 
  getProductsByCategory 
} = require('../utils/categoryUtils');

// @desc    Get all product items for the current tenant
// @route   GET /api/v1/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const query = { tenantId: req.tenant.id };
    
    // Handle category filtering using the new structure
    if (req.query.categoryPath) {
      // Parse the category path from query param (comma-separated)
      const categoryPath = req.query.categoryPath.split(',');
      
      try {
        const products = await getProductsByCategoryPath(categoryPath, req.tenant.id);
        
        return res.status(200).json({
          success: true,
          count: products.length,
          data: products
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
      // If categoryId is provided, get all products in this category
      // and its descendants
      try {
        const products = await getProductsByCategory(
          req.query.categoryId, 
          req.tenant.id
        );
        
        return res.status(200).json({
          success: true,
          count: products.length,
          data: products
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
      const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
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
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Get a single product by ID
// @route   GET /api/v1/products/:id
// @access  Private
const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      tenantId: req.tenant.id
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
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

// @desc    Create one or multiple products
// @route   POST /api/v1/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    let products;
    
    // Check if the request body is an array of products or a single product
    if (Array.isArray(req.body)) {
      // Handle array of products
      const productsData = req.body.map(product => ({
        ...product,
        tenantId
      }));
      
      products = await Product.insertMany(productsData);
      
      res.status(201).json({
        success: true,
        count: products.length,
        data: products
      });
    } else {
      // Handle single product for backward compatibility
      const productData = {
        ...req.body,
        tenantId
      };
      
      const product = await Product.create(productData);
      
      res.status(201).json({
        success: true,
        data: product
      });
    }
  } catch (error) {
    console.error('Error creating product(s):', error);
    
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
      message: 'Error creating product(s)',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct
};
