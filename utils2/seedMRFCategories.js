const mongoose = require('mongoose');
const Category = require('../models/Category');
const Tenant = require('../models/Tenant');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// MongoDB Connection
mongoose.connect("mongodb://admin:admin@localhost:27017/SmartProcureDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Connected...');
}).catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

const seedMRFCategories = async () => {
  try {
    console.log('Starting MRF categories seeding...');

    // Step 1: Find MRF Tenant
    const mrfTenant = await Tenant.findOne({ name: 'MRF' });
    
    if (!mrfTenant) {
      console.error('MRF tenant not found. Please run seedMRFData.js first.');
      process.exit(1);
    }
    
    console.log(`Found MRF tenant with ID: ${mrfTenant._id}`);

    // Step 2: Import category data from JSON
    const categoryData = [
      {
        "name": "Administration",
        "ancestors": [],
        "parent": null,
        "level": 0,
        "tenantId": mrfTenant._id,
        "attributes": {
          "items": 1240
        },
        "image": "/images/administration.jpg",
        "description": "Office supplies, stationery, and administrative services"
      },
      {
        "name": "Safety",
        "ancestors": [],
        "parent": null,
        "level": 0,
        "tenantId": mrfTenant._id,
        "attributes": {
          "items": 643
        },
        "image": "/images/Safety.jpg",
        "description": "Safety equipment and cleaning supplies products"
      },
      {
        "name": "Electrical, Electronics & Power",
        "ancestors": [],
        "parent": null,
        "level": 0,
        "tenantId": mrfTenant._id,
        "attributes": {
          "items": 728
        },
        "image": "/images/Electrical.jpg",
        "description": "Electrical components, wiring, and power equipment"
      },
      {
        "name": "Tools",
        "ancestors": [],
        "parent": null,
        "level": 0,
        "tenantId": mrfTenant._id,
        "attributes": {
          "items": 956
        },
        "image": "/images/Tools.jpg",
        "description": "Hand tools, power tools, and industrial machinery"
      },
      {
        "name": "Metals & Raw Materials",
        "ancestors": [],
        "parent": null,
        "level": 0,
        "tenantId": mrfTenant._id,
        "attributes": {
          "items": 482
        },
        "image": "/images/Metals.jpg",
        "description": "Industrial metals, plastics, and raw production materials"
      },
      {
        "name": "MRO",
        "ancestors": [],
        "parent": null,
        "level": 0,
        "tenantId": mrfTenant._id,
        "attributes": {
          "items": 956
        },
        "image": "/images/mro.jpg",
        "description": "Maintenance, repair, and operations equipment"
      },
      {
        "name": "IT",
        "ancestors": [],
        "parent": null,
        "level": 0,
        "tenantId": mrfTenant._id,
        "attributes": {
          "items": 1893
        },
        "image": "/images/it.jpg",
        "description": "Hardware, software, and IT services"
      },
      {
        "name": "Facilities",
        "ancestors": [],
        "parent": null,
        "level": 0,
        "tenantId": mrfTenant._id,
        "attributes": {
          "items": 754
        },
        "image": "/images/facilities.jpg",
        "description": "Building maintenance and facilities management"
      },
      {
        "name": "Capex",
        "ancestors": [],
        "parent": null,
        "level": 0,
        "tenantId": mrfTenant._id,
        "attributes": {
          "items": 325
        },
        "image": "/images/capex.jpg",
        "description": "Capital expenditure and major investments"
      },
      {
        "name": "Miscellaneous",
        "ancestors": [],
        "parent": null,
        "level": 0,
        "tenantId": mrfTenant._id,
        "attributes": {
          "items": 315
        },
        "image": "/images/Miscellaneous.jpg",
        "description": "Other industrial and office supplies"
      }
    ];

    // Step 3: Delete existing categories for this tenant to avoid duplicates
    console.log('Deleting existing categories...');
    await Category.deleteMany({ tenantId: mrfTenant._id });

    // Step 4: Create new categories
    console.log('Creating new categories...');
    const createdCategories = await Category.insertMany(categoryData);

    console.log(`Successfully created ${createdCategories.length} categories for MRF tenant!`);
    
    // Step 5: Log summary
    console.log('=== MRF Categories Summary ===');
    createdCategories.forEach(category => {
      console.log(`- ${category.name} (${category._id}): ${category.description}`);
    });
    
    console.log('============================');

  } catch (error) {
    console.error('Error seeding MRF categories:', error);
  } finally {
    // Close database connection
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedMRFCategories();
