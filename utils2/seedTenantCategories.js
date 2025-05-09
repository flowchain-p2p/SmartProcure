const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Category = require('../models/Category');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get tenant name from command line arguments
const tenantName = process.argv[2] || 'MRF'; 
const tenantSlug = process.argv[3] || tenantName.toLowerCase();

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

const seedTenantCategories = async () => {
  try {
    console.log(`Starting ${tenantName} categories seeding...`);

    // Find tenant by name
    const tenant = await Tenant.findOne({ name: tenantName });
    if (!tenant) {
      console.error(`Tenant '${tenantName}' not found. Please run seedTenantData.js first.`);
      process.exit(1);
    }    // Define category data
    const categories = [
      { 
        name: 'Office Supplies', 
        description: 'General office supplies including stationery, paper products, and desk accessories', 
        tenantId: tenant._id,
        isActive: true,
        image: '/uploads/categories/office-supplies.jpg'
      },      { 
        name: 'IT Equipment', 
        description: 'Computers, servers, networking equipment, and peripherals', 
        tenantId: tenant._id,
        isActive: true,
        image: '/uploads/categories/it-equipment.jpg'
      },
      { 
        name: 'Furniture', 
        description: 'Office furniture, desks, chairs, and storage solutions', 
        tenantId: tenant._id,
        isActive: true,
        image: '/uploads/categories/furniture.jpg'
      },
      { 
        name: 'Printing Services', 
        description: 'Printing, copying, and document management services', 
        tenantId: tenant._id,
        isActive: true,
        image: '/uploads/categories/printing-services.jpg'
      },
      { 
        name: 'Professional Services', 
        description: 'Consulting, legal, accounting, and other professional services', 
        tenantId: tenant._id,
        isActive: true,
        image: '/uploads/categories/professional-services.jpg'
      },
      { 
        name: 'Machinery', 
        description: 'Industrial machinery, equipment, and parts', 
        tenantId: tenant._id,
        isActive: true,
        image: '/uploads/categories/machinery.jpg'
      },
      { 
        name: 'Laboratory Supplies', 
        description: 'Lab equipment, chemicals, and research materials', 
        tenantId: tenant._id,
        isActive: true,
        image: '/uploads/categories/lab-supplies.jpg'
      },
      { 
        name: 'Raw Materials', 
        description: 'Raw materials for manufacturing processes', 
        tenantId: tenant._id,
        isActive: true,
        image: '/uploads/categories/raw-materials.jpg'
      },
      { 
        name: 'Maintenance Services', 
        description: 'Facility maintenance and repair services', 
        tenantId: tenant._id,
        isActive: true,
        image: '/uploads/categories/maintenance.jpg'
      },
      { 
        name: 'Transportation', 
        description: 'Transportation and logistics services', 
        tenantId: tenant._id,
        isActive: true,
        image: '/uploads/categories/transportation.jpg'
      }
    ];

    // Delete existing categories for this tenant to avoid duplicates
    console.log('Removing existing categories...');
    await Category.deleteMany({ tenantId: tenant._id });
    
    // Create categories
    console.log('Creating new categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`${createdCategories.length} categories created for ${tenantName} tenant`);

    // Log summary of created entities
    console.log(`=== ${tenantName} Categories Seed Summary ===`);
    console.log(`Tenant: ${tenant.name} (${tenant._id})`);
    console.log(`Categories: ${createdCategories.length} created`);
    console.log('====================================');
    
  } catch (error) {
    console.error(`Error seeding ${tenantName} categories:`, error);
  } finally {
    // Close database connection
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedTenantCategories();
