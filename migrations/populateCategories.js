const mongoose = require('mongoose');
const path = require('path');

// Import models
const Catalog = require('../models/Catalog');
const Category = require('../models/Category');

// Import database connection
const connectDatabase = require('../config/database');

async function migrateCategories() {
  try {
    // Connect to database
    await connectDatabase();
    
    console.log('Starting category migration...');
    
    // Get all distinct category/subcategory combinations by tenant
    const distinctCategories = await Catalog.aggregate([
      {
        $group: {
          _id: {
            tenantId: '$tenantId',
            category: '$category',
            subCategory: '$subCategory'
          }
        }
      }
    ]);
    
    console.log(`Found ${distinctCategories.length} distinct category combinations`);
    
    // Group by tenantId and category to organize the data
    const tenantCategories = {};
    distinctCategories.forEach(item => {
      const { tenantId, category, subCategory } = item._id;
      const tenantIdStr = tenantId.toString();
      
      if (!tenantCategories[tenantIdStr]) {
        tenantCategories[tenantIdStr] = {};
      }
      
      if (!tenantCategories[tenantIdStr][category]) {
        tenantCategories[tenantIdStr][category] = [];
      }
      
      tenantCategories[tenantIdStr][category].push(subCategory);
    });
    
    console.log(`Organized into ${Object.keys(tenantCategories).length} tenants`);
    
    // Process each tenant's categories
    for (const tenantIdStr of Object.keys(tenantCategories)) {
      console.log(`Processing tenant: ${tenantIdStr}`);
      const tenantId = new mongoose.Types.ObjectId(tenantIdStr);
      
      // Create categories for each tenant
      for (const categoryName of Object.keys(tenantCategories[tenantIdStr])) {
        // 1. Create root category (level 0)
        let rootCategory = await Category.findOne({ 
          tenantId: tenantId,
          name: categoryName,
          level: 0
        });
        
        if (!rootCategory) {
          rootCategory = await Category.create({
            name: categoryName,
            parent: null,
            ancestors: [],
            level: 0,
            tenantId: tenantId
          });
          console.log(`Created root category: ${categoryName}`);
        }
        
        // 2. Create subcategories (level 1)
        for (const subCategoryName of tenantCategories[tenantIdStr][categoryName]) {
          const existingSubCategory = await Category.findOne({
            tenantId: tenantId,
            name: subCategoryName,
            parent: rootCategory._id
          });
          
          if (!existingSubCategory) {
            await Category.create({
              name: subCategoryName,
              parent: rootCategory._id,
              ancestors: [{ _id: rootCategory._id, name: rootCategory.name }],
              level: 1,
              tenantId: tenantId
            });
            console.log(`Created subcategory: ${categoryName} > ${subCategoryName}`);
          }
        }
      }
    }
    
    console.log('Category migration completed successfully');
  } catch (error) {
    console.error('Error during category migration:', error);
  } finally {
    // Close database connection
    setTimeout(() => {
      mongoose.connection.close();
      console.log('Database connection closed');
    }, 1000);
  }
}

// Run the migration
migrateCategories();
