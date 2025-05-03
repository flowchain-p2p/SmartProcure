const mongoose = require('mongoose');
const path = require('path');

// Import models
const Catalog = require('../models/Catalog');
const Category = require('../models/Category');

// Import database connection
const connectDatabase = require('../config/database');

async function updateCatalogs() {
  try {
    // Connect to database
    await connectDatabase();
    
    console.log('Starting catalog update migration...');
    
    // Get all catalog items
    const catalogItems = await Catalog.find();
    console.log(`Found ${catalogItems.length} catalog items to update`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each catalog item
    for (const item of catalogItems) {
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
        
        // Update the catalog item with the categoryId and categoryPath
        item.categoryId = leafCategory._id;
        item.categoryPath = [leafCategory.ancestors[0].name, leafCategory.name];
        
        await item.save();
        updatedCount++;
        
        if (updatedCount % 100 === 0) {
          console.log(`Updated ${updatedCount} items so far...`);
        }
      } catch (err) {
        console.error(`Error updating catalog item ${item._id}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`Migration summary:`);
    console.log(`Successfully updated: ${updatedCount} catalog items`);
    console.log(`Failed to update: ${errorCount} catalog items`);
  } catch (error) {
    console.error('Error during catalog update:', error);
  } finally {
    // Close database connection
    setTimeout(() => {
      mongoose.connection.close();
      console.log('Database connection closed');
    }, 1000);
  }
}

// Run the update
updateCatalogs();
