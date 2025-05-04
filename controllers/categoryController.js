const Category = require('../models/Category');
const mongoose = require('mongoose');
const { 
  getCategoriesByTenant, 
  getChildCategories,
  getCategoryById
} = require('../utils/categoryUtils');

// @desc    Get all categories for the current tenant
// @route   GET /api/v1/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const categories = await getCategoriesByTenant(req.tenant.id);
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// @desc    Get a category by ID
// @route   GET /api/v1/categories/:id
// @access  Private
const getCategory = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }
    
    const category = await getCategoryById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if the category belongs to the current tenant
    if (category.tenantId.toString() !== req.tenant.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this category'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// @desc    Get child categories for a parent
// @route   GET /api/v1/categories/:id/children
// @access  Private
const getCategoryChildren = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }
    
    // Verify that the parent category belongs to the tenant
    const parentCategory = await getCategoryById(req.params.id);
    
    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: 'Parent category not found'
      });
    }
    
    if (parentCategory.tenantId.toString() !== req.tenant.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this category'
      });
    }
    
    const children = await getChildCategories(req.params.id);
    
    res.status(200).json({
      success: true,
      count: children.length,
      data: children
    });
  } catch (error) {
    console.error('Error fetching category children:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category children',
      error: error.message
    });
  }
};

// @desc    Create a new category
// @route   POST /api/v1/categories
// @access  Private
const createCategory = async (req, res) => {
  try {
    console.log('Request Body:', req.body); // Log the request body for debugging
    const { name, parent, attributes, image, description } = req.body;
    
    let level = 0;
    let ancestors = [];
    
    // If this is a child category, set up ancestors and level
    if (parent) {
      const parentCategory = await getCategoryById(parent);
      
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
      
      // Ensure parent belongs to the same tenant
      if (parentCategory.tenantId.toString() !== req.tenant.id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Parent category does not belong to your tenant'
        });
      }
      
      // Set level to parent level + 1
      level = parentCategory.level + 1;
      
      // Copy parent's ancestors and add parent to ancestors array
      ancestors = [
        ...parentCategory.ancestors,
        { _id: parentCategory._id, name: parentCategory.name }
      ];
    }
    
    // Create the new category
    const category = await Category.create({
      name,
      image, // Added image field
      description, // Added description field
      parent,
      ancestors,
      level,
      tenantId: req.tenant.id,
      attributes: attributes || {}
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    
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
      message: 'Error creating category',
      error: error.message
    });
  }
};

// @desc    Update a category
// @route   PUT /api/v1/categories/:id
// @access  Private
const updateCategory = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }
    
    // Find the category and check ownership
    let category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if the category belongs to the current tenant
    if (category.tenantId.toString() !== req.tenant.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this category'
      });
    }
      // Only allow updating certain fields
    const { name, attributes, image, description } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (image) updateData.image = image;
    if (description) updateData.description = description;
    if (attributes) updateData.attributes = attributes;
    
    // Update category
    category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    
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
      message: 'Error updating category',
      error: error.message
    });
  }
};

module.exports = {
  getCategories,
  getCategory,
  getCategoryChildren,
  createCategory,
  updateCategory
};
