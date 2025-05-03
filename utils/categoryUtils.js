const mongoose = require('mongoose');
const Catalog = require('../models/Catalog');
const Category = require('../models/Category');

/**
 * Get all catalogs under a specific category path
 * @param {Array} categoryPath - Array of category names (e.g., ["Tools", "Power Tools"])
 * @param {ObjectId|string} tenantId - Optional tenant ID to scope the query
 * @returns {Promise<Array>} - Array of catalog documents
 */
async function getCatalogsByCategoryPath(categoryPath, tenantId = null) {
  try {
    // Build the query
    const query = { categoryPath: { $all: categoryPath } };
    
    // Add tenant filter if provided
    if (tenantId) {
      // Validate ObjectId format if it's a string
      if (typeof tenantId === 'string') {
        if (!mongoose.Types.ObjectId.isValid(tenantId)) {
          console.warn('Invalid tenantId format in getCatalogsByCategoryPath');
          return [];
        }
        query.tenantId = new mongoose.Types.ObjectId(tenantId);
      } else {
        query.tenantId = tenantId;
      }
    }
    
    // Execute the query
    const catalogs = await Catalog.find(query).sort({ createdAt: -1 });
    
    return catalogs;
  } catch (error) {
    console.error('Error fetching catalogs by category path:', error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Get all catalogs under a specific category (including all descendant categories)
 * @param {ObjectId|string} categoryId - ID of the category
 * @param {ObjectId|string} tenantId - Optional tenant ID to scope the query
 * @returns {Promise<Array>} - Array of catalog documents
 */
async function getCatalogsByCategory(categoryId, tenantId = null) {
  try {
    // Validate the categoryId
    if (typeof categoryId === 'string' && !mongoose.Types.ObjectId.isValid(categoryId)) {
      console.warn(`Invalid categoryId format: ${categoryId}`);
      return [];
    }
    
    // Convert string ID to ObjectId if needed
    const catId = typeof categoryId === 'string' ? 
      new mongoose.Types.ObjectId(categoryId) : categoryId;
    
    // Find the target category
    const targetCategory = await Category.findById(catId);
    
    if (!targetCategory) {
      console.warn(`Category with ID ${categoryId} not found`);
      return [];
    }
    
    // Find all categories that have this category in their ancestors
    // or are direct descendants (parent = categoryId)
    const categories = await Category.find({ 
      $or: [
        { 'ancestors._id': catId },
        { parent: catId }
      ]
    });
    
    // Add the category itself
    const categoryIds = [catId, ...categories.map(cat => cat._id)];
    
    // Build the query
    const query = { categoryId: { $in: categoryIds } };
    
    // Add tenant filter if provided
    if (tenantId) {
      // Validate ObjectId format if it's a string
      if (typeof tenantId === 'string') {
        if (!mongoose.Types.ObjectId.isValid(tenantId)) {
          console.warn('Invalid tenantId format in getCatalogsByCategory');
          return [];
        }
        query.tenantId = new mongoose.Types.ObjectId(tenantId);
      } else {
        query.tenantId = tenantId;
      }
    }
    
    // Execute the query
    const catalogs = await Catalog.find(query).sort({ createdAt: -1 });
    
    return catalogs;
  } catch (error) {
    console.error('Error fetching catalogs by category:', error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Get category by ID with its ancestors
 * @param {ObjectId|string} categoryId - ID of the category
 * @returns {Promise<Object>} - Category document
 */
async function getCategoryById(categoryId) {
  try {
    // Validate ObjectId format if it's a string
    if (typeof categoryId === 'string' && !mongoose.Types.ObjectId.isValid(categoryId)) {
      return null;
    }
    
    const catId = typeof categoryId === 'string' ? 
      new mongoose.Types.ObjectId(categoryId) : categoryId;
      
    const category = await Category.findById(catId);
    return category;
  } catch (error) {
    console.error('Error in getCategoryById:', error);
    return null;
  }
}

/**
 * Get all categories for a tenant
 * @param {ObjectId|string} tenantId - Tenant ID
 * @returns {Promise<Array>} - Array of category documents
 */
async function getCategoriesByTenant(tenantId) {
  try {
    // Validate ObjectId format if it's a string
    if (typeof tenantId === 'string' && !mongoose.Types.ObjectId.isValid(tenantId)) {
      return [];
    }
    
    const tId = typeof tenantId === 'string' ? 
      new mongoose.Types.ObjectId(tenantId) : tenantId;
      
    const categories = await Category.find({ tenantId: tId })
      .sort({ level: 1, name: 1 });
      
    return categories;
  } catch (error) {
    console.error('Error in getCategoriesByTenant:', error);
    return [];
  }
}

/**
 * Get all child categories for a parent category
 * @param {ObjectId|string} parentId - Parent category ID
 * @returns {Promise<Array>} - Array of child category documents
 */
async function getChildCategories(parentId) {
  try {
    // Validate ObjectId format if it's a string
    if (typeof parentId === 'string' && !mongoose.Types.ObjectId.isValid(parentId)) {
      return [];
    }
    
    const pId = typeof parentId === 'string' ? 
      new mongoose.Types.ObjectId(parentId) : parentId;
      
    const categories = await Category.find({ parent: pId })
      .sort({ name: 1 });
      
    return categories;
  } catch (error) {
    console.error('Error in getChildCategories:', error);
    return [];
  }
}

module.exports = {
  getCatalogsByCategoryPath,
  getCatalogsByCategory,
  getCategoryById,
  getCategoriesByTenant,
  getChildCategories
};
