const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const VendorCategory = require('../models/VendorCategory');

// @desc    Get all vendors for a tenant
// @route   GET /api/v1/vendors
// @access  Private
const getVendors = async (req, res) => {
  try {
    // Get tenant ID from request (added by tenant middleware)
    const tenantId = req.tenant._id;
    
    // Basic filtering
    const query = { tenantId };
    
    // Add search functionality
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { code: { $regex: req.query.search, $options: 'i' } },
        { contactPerson: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Add status filtering
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Add category filtering
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Add preferred filtering
    if (req.query.isPreferred) {
      query.isPreferred = req.query.isPreferred === 'true';
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const vendors = await Vendor.find(query)
      .skip(startIndex)
      .limit(limit)
      .sort({ name: 1 });

    // Get total count for pagination
    const total = await Vendor.countDocuments(query);

    // Build pagination object
    const pagination = {
      page,
      pages: Math.ceil(total / limit),
      limit,
      total
    };

    res.status(200).json({
      success: true,
      count: vendors.length,
      pagination,
      data: vendors
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendors',
      error: error.message
    });
  }
};

// @desc    Get single vendor
// @route   GET /api/v1/vendors/:id
// @access  Private
const getVendor = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor ID format'
      });
    }
    
    const tenantId = req.tenant._id;
    
    const vendor = await Vendor.findOne({ 
      _id: req.params.id, 
      tenantId 
    });    
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: `Vendor not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor',
      error: error.message
    });
  }
};

// @desc    Create new vendor
// @route   POST /api/v1/vendors
// @access  Private
const createVendor = async (req, res) => {
  try {
    // Add tenantId from authenticated user's tenant
    req.body.tenantId = req.tenant._id;
    req.body.createdBy = req.user._id;

    // Validate if vendor code already exists for this tenant
    if (req.body.code) {
      const existingVendor = await Vendor.findOne({
        tenantId: req.tenant._id,
        code: req.body.code
      });

      if (existingVendor) {
        return res.status(400).json({
          success: false,
          message: `Vendor with code ${req.body.code} already exists for this tenant`
        });
      }
    }
    
    const vendor = await Vendor.create(req.body);

    res.status(201).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating vendor',
      error: error.message
    });
  }
};

// @desc    Update vendor
// @route   PUT /api/v1/vendors/:id
// @access  Private
const updateVendor = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor ID format'
      });
    }
    
    const tenantId = req.tenant._id;
    
    // Check if vendor exists
    let vendor = await Vendor.findOne({ 
      _id: req.params.id, 
      tenantId 
    });
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: `Vendor not found with id of ${req.params.id}`
      });
    }

    // If updating code, check it's not duplicated
    if (req.body.code && req.body.code !== vendor.code) {
      const existingVendor = await Vendor.findOne({
        tenantId,
        code: req.body.code,
        _id: { $ne: req.params.id }
      });

      if (existingVendor) {
        return res.status(400).json({
          success: false,
          message: `Vendor with code ${req.body.code} already exists for this tenant`
        });
      }
    }
    
    // Update vendor
    vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.id, tenantId }, 
      { $set: req.body }, 
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating vendor',
      error: error.message
    });
  }
};

// @desc    Delete vendor
// @route   DELETE /api/v1/vendors/:id
// @access  Private
const deleteVendor = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor ID format'
      });
    }
    
    const tenantId = req.tenant._id;
    
    const vendor = await Vendor.findOne({ 
      _id: req.params.id, 
      tenantId 
    });
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: `Vendor not found with id of ${req.params.id}`
      });
    }

    // Check if vendor has related records (implementation depends on your data model)
    // This is just a placeholder, you need to implement this according to your requirements
    // const hasRelatedRecords = await checkVendorRelatedRecords(req.params.id);
    // if (hasRelatedRecords) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot delete vendor with active related records`
    //   });
    // }
    
    await vendor.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vendor',
      error: error.message
    });
  }
};

// @desc    Get vendor categories (for dropdown lists)
// @route   GET /api/v1/vendors/categories
// @access  Private
const getVendorCategories = async (req, res) => {
  try {
    const tenantId = req.tenant._id;

    // Get distinct categories for this tenant
    const categories = await Vendor.distinct('category', { 
      tenantId,
      category: { $ne: null, $ne: "" }  
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching vendor categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor categories',
      error: error.message
    });
  }
};

// @desc    Associate vendor with categories
// @route   POST /api/v1/vendors/:id/categories
// @access  Private
const associateVendorWithCategories = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor ID format'
      });
    }
    
    const tenantId = req.tenant._id;
    const vendorId = req.params.id;
    
    // Verify vendor exists and belongs to tenant
    const vendor = await Vendor.findOne({ 
      _id: vendorId, 
      tenantId 
    });
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: `Vendor not found with id of ${vendorId}`
      });
    }
    
    // The request body should contain either a single categoryId or an array of category objects
    let categoryData = [];
    
    if (Array.isArray(req.body)) {
      categoryData = req.body;
    } else if (req.body.categoryId) {
      categoryData = [{ categoryId: req.body.categoryId }];
    } else if (req.body.categories && Array.isArray(req.body.categories)) {
      categoryData = req.body.categories;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Request must include categoryId or an array of category objects'
      });
    }
    
    const results = {
      added: [],
      errors: []
    };
    
    // Process each category
    for (const item of categoryData) {
      try {
        const categoryId = item.categoryId;
        
        // Validate category ID
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
          results.errors.push({
            categoryId,
            error: 'Invalid category ID format'
          });
          continue;
        }
        
        // Verify category exists and belongs to tenant
        const category = await Category.findOne({ 
          _id: categoryId, 
          tenantId 
        });
        
        if (!category) {
          results.errors.push({
            categoryId,
            error: 'Category not found or does not belong to this tenant'
          });
          continue;
        }
        
        // Check if relationship already exists
        const existingRelation = await VendorCategory.findOne({
          vendorId,
          categoryId,
          tenantId
        });
        
        if (existingRelation) {
          // Update existing relationship
          const updatedRelation = await VendorCategory.findOneAndUpdate(
            { vendorId, categoryId, tenantId },
            { 
              $set: { 
                preferredSupplier: item.preferredSupplier || false,
                priceRange: item.priceRange || {
                  min: 0,
                  max: 0,
                  currency: 'USD'
                },
                notes: item.notes || ''
              } 
            },
            { new: true }
          );
          results.added.push(updatedRelation);
        } else {
          // Create new relationship
          const newRelation = await VendorCategory.create({
            vendorId,
            categoryId,
            tenantId,
            preferredSupplier: item.preferredSupplier || false,
            priceRange: item.priceRange || {
              min: 0,
              max: 0,
              currency: 'USD'
            },
            notes: item.notes || ''
          });
          results.added.push(newRelation);
        }
      } catch (error) {
        console.error('Error processing category:', error);
        results.errors.push({
          categoryId: item.categoryId,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      success: results.added.length > 0,
      count: results.added.length,
      data: results.added,
      errors: results.errors.length > 0 ? results.errors : undefined
    });
    
  } catch (error) {
    console.error('Error associating vendor with categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error associating vendor with categories',
      error: error.message
    });
  }
};

// @desc    Remove vendor from category
// @route   DELETE /api/v1/vendors/:id/categories/:categoryId
// @access  Private
const removeVendorFromCategory = async (req, res) => {
  try {
    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || 
        !mongoose.Types.ObjectId.isValid(req.params.categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    const tenantId = req.tenant._id;
    const vendorId = req.params.id;
    const categoryId = req.params.categoryId;
    
    // Find and remove the relationship
    const deletedRelation = await VendorCategory.findOneAndDelete({
      vendorId,
      categoryId,
      tenantId
    });
    
    if (!deletedRelation) {
      return res.status(404).json({
        success: false,
        message: 'Vendor-category relationship not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Vendor removed from category successfully',
      data: {}
    });
    
  } catch (error) {
    console.error('Error removing vendor from category:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing vendor from category',
      error: error.message
    });
  }
};

// @desc    Get categories for a vendor
// @route   GET /api/v1/vendors/:id/categories
// @access  Private
const getVendorCategoriesById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor ID format'
      });
    }
    
    const tenantId = req.tenant._id;
    const vendorId = req.params.id;
    
    // Verify vendor exists and belongs to tenant
    const vendor = await Vendor.findOne({ 
      _id: vendorId, 
      tenantId 
    });
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: `Vendor not found with id of ${vendorId}`
      });
    }
    
    // Find all category relationships for this vendor
    const vendorCategories = await VendorCategory.find({
      vendorId,
      tenantId
    }).populate('categoryId');
    
    // Extract and format category information
    const categories = vendorCategories.map(vc => ({
      _id: vc.categoryId._id,
      name: vc.categoryId.name,
      preferredSupplier: vc.preferredSupplier,
      priceRange: vc.priceRange,
      notes: vc.notes
    }));
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
    
  } catch (error) {
    console.error('Error fetching vendor categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor categories',
      error: error.message
    });
  }
};

// @desc    Get vendors for a category
// @route   GET /api/v1/categories/:id/vendors
// @access  Private
const getVendorsByCategory = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }
    
    const tenantId = req.tenant._id;
    const categoryId = req.params.id;
    
    // Verify category exists and belongs to tenant
    const category = await Category.findOne({ 
      _id: categoryId, 
      tenantId 
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category not found with id of ${categoryId}`
      });
    }
    
    // Find all vendor relationships for this category
    const vendorCategories = await VendorCategory.find({
      categoryId,
      tenantId
    }).populate('vendorId');
    
    // Extract and format vendor information
    const vendors = vendorCategories.map(vc => ({
      _id: vc.vendorId._id,
      name: vc.vendorId.name,
      code: vc.vendorId.code,
      contactPerson: vc.vendorId.contactPerson,
      email: vc.vendorId.email,
      phone: vc.vendorId.phone,
      preferredSupplier: vc.preferredSupplier,
      priceRange: vc.priceRange,
      notes: vc.notes
    }));
    
    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
    
  } catch (error) {
    console.error('Error fetching category vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category vendors',
      error: error.message
    });
  }
};

// @desc    Get vendor ID by category name
// @route   GET /api/v1/vendors/by-category/:categoryName
// @access  Private
const getVendorIdByCategoryName = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { categoryName } = req.params;
    
    // Find category by name
    const category = await Category.findOne({ 
      name: categoryName,
      tenantId 
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category not found with name ${categoryName}`
      });
    }
    
    // Find vendor-category relationship for this category
    // Prioritize preferred suppliers
    const vendorCategory = await VendorCategory.findOne({
      categoryId: category._id,
      tenantId,
      preferredSupplier: true
    }).populate('vendorId');
    
    // If no preferred supplier, get any supplier for this category
    if (!vendorCategory) {
      const anyVendorCategory = await VendorCategory.findOne({
        categoryId: category._id,
        tenantId
      }).populate('vendorId');
      
      if (!anyVendorCategory) {
        return res.status(404).json({
          success: false,
          message: `No vendor found for category ${categoryName}`
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          vendorId: anyVendorCategory.vendorId._id,
          vendorName: anyVendorCategory.vendorId.name,
          preferred: false
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        vendorId: vendorCategory.vendorId._id,
        vendorName: vendorCategory.vendorId.name,
        preferred: true
      }
    });
    
  } catch (error) {
    console.error('Error finding vendor by category name:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding vendor by category name',
      error: error.message
    });
  }
};

// @desc    Get vendor ID by category name (for internal use)
// @access  Private
const getVendorByCategoryNameInternal = async (categoryName, tenantId) => {
  try {
    // Find category by name
    const category = await Category.findOne({ 
      name: categoryName,
      tenantId 
    });
    
    if (!category) {
      return { success: false, message: `Category not found with name ${categoryName}` };
    }
    
    // Find vendor-category relationship for this category
    // Prioritize preferred suppliers
    const vendorCategory = await VendorCategory.findOne({
      categoryId: category._id,
      tenantId,
      preferredSupplier: true
    }).populate('vendorId');
    
    // If no preferred supplier, get any supplier for this category
    if (!vendorCategory) {
      const anyVendorCategory = await VendorCategory.findOne({
        categoryId: category._id,
        tenantId
      }).populate('vendorId');
      
      if (!anyVendorCategory) {
        return { success: false, message: `No vendor found for category ${categoryName}` };
      }
      
      return { 
        success: true, 
        data: {
          vendorId: anyVendorCategory.vendorId._id,
          vendorName: anyVendorCategory.vendorId.name,
          preferred: false
        }
      };
    }
    
    return {
      success: true,
      data: {
        vendorId: vendorCategory.vendorId._id,
        vendorName: vendorCategory.vendorId.name,
        preferred: true
      }
    };
    
  } catch (error) {
    console.error('Error finding vendor by category name:', error);
    return {
      success: false,
      message: 'Error finding vendor by category name',
      error: error.message
    };
  }
};

module.exports = {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorCategories,
  associateVendorWithCategories,
  removeVendorFromCategory,
  getVendorCategoriesById,
  getVendorsByCategory,
  getVendorIdByCategoryName,
  getVendorByCategoryNameInternal
};
