const mongoose = require('mongoose');
const path = require('path');

// Import models
const Product = require('../models/Product');
const Category = require('../models/Category');

// Import database connection
const connectDatabase = require('../config/database');

async function updateProducts() {
  try {
    // Connect to database
    await connectDatabase();
    
    console.log('Starting product update migration...');
    
    // Get all product items
    const productItems = await Product.find();
    console.log(`Found ${productItems.length} product items to update`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each product item
    for (const item of productItems) {
      try {
        // Find the leaf category (subcategory)
        const leafCategory = await Category.findOne({
          tenantId: item.tenantId,
          name: item.subCategory,
          level: 1 // Subcategory level
        });
        
        if (!leafCategory) {
          console.warn(`Could not find category for: ${item.category} > ${item.subCategory} (tenant: ${item.tenantId})`);
          errorCount++;
          continue;
        }
        
        // Update the product item with the categoryId and categoryPath
        item.categoryId = leafCategory._id;
        item.categoryPath = [leafCategory.ancestors[0].name, leafCategory.name];
        
        await item.save();
        updatedCount++;
        
        if (updatedCount % 100 === 0) {
          console.log(`Updated ${updatedCount} items so far...`);
        }
      } catch (err) {
        console.error(`Error updating product item ${item._id}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`Migration summary:`);
    console.log(`Successfully updated: ${updatedCount} product items`);
    console.log(`Failed to update: ${errorCount} product items`);
  } catch (error) {
    console.error('Error during product update:', error);
  } finally {
    // Close database connection
    setTimeout(() => {
      mongoose.connection.close();
      console.log('Database connection closed');
    }, 1000);
  }
}

// Run the update
updateProducts();
