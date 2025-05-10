const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const VendorCategory = require('../models/VendorCategory');
const dotenv = require('dotenv');

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

const seedMRFVendorCategories = async () => {
  try {
    console.log('Starting MRF vendor-category mapping seeding...');

    // Step 1: Find MRF Tenant
    const mrfTenant = await Tenant.findOne({ name: 'MRF' });
    
    if (!mrfTenant) {
      console.error('MRF tenant not found. Please run seedMRFData.js first.');
      process.exit(1);
    }
    
    console.log(`Found MRF tenant with ID: ${mrfTenant._id}`);

    // Step 2: Get all MRF vendors
    const vendors = await Vendor.find({ tenantId: mrfTenant._id });
    if (vendors.length === 0) {
      console.error('No vendors found for MRF tenant. Please run seedMRFSuppliers.js first.');
      process.exit(1);
    }
    console.log(`Found ${vendors.length} vendors for MRF tenant`);

    // Step 3: Get all MRF categories
    const categories = await Category.find({ tenantId: mrfTenant._id });
    if (categories.length === 0) {
      console.error('No categories found for MRF tenant. Please run seedMRFCategories.js first.');
      process.exit(1);
    }
    console.log(`Found ${categories.length} categories for MRF tenant`);

    // Create a map of category names to IDs for easier lookup
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name] = category._id;
    });

    // Step 4: Delete existing vendor-category mappings for this tenant to avoid duplicates
    console.log('Deleting existing vendor-category mappings...');
    await VendorCategory.deleteMany({ tenantId: mrfTenant._id });

    // Step 5: Create vendor-category mappings based on the vendor's category field
    const vendorCategoryMappings = [];
    const vendorMap = {};

    // First, create mappings for primary categories (matching vendor.category value)
    for (const vendor of vendors) {
      // Store vendor in map for later use with secondary categories
      vendorMap[vendor.name] = vendor;

      // Find category that matches the vendor's primary category
      if (vendor.category && categoryMap[vendor.category]) {
        vendorCategoryMappings.push({
          vendorId: vendor._id,
          categoryId: categoryMap[vendor.category],
          tenantId: mrfTenant._id,
          preferredSupplier: vendor.isPreferred || false,
          priceRange: {
            min: 0,
            max: 0,
            currency: 'INR'
          },
          notes: `Primary category for ${vendor.name}`,
        });
      }
    }

    // Step 6: Create additional mappings (secondary categories)
    // Define secondary category mappings to make vendors supply multiple categories
    // const secondaryCategoryMappings = [
    //   // TechComponents Ltd (IT primary category) also supplies Electrical and Administration
    //   { vendorName: "TechComponents Ltd", additionalCategories: ["Electrical, Electronics & Power", "Administration"] },
      
    //   // Industrial Solutions (MRO primary category) also supplies Tools and Facilities
    //   { vendorName: "Industrial Solutions Pvt Ltd", additionalCategories: ["Tools", "Facilities"] },
      
    //   // SafetyFirst (Safety primary category) also supplies MRO
    //   { vendorName: "SafetyFirst Equipment Ltd", additionalCategories: ["MRO"] },
      
    //   // ElectroPower (Electrical, Electronics & Power primary category) also supplies Capex and Safety
    //   { vendorName: "ElectroPower Systems", additionalCategories: ["Capex", "Safety"] },
      
    //   // PowerTools (Tools primary category) also supplies MRO and Safety
    //   { vendorName: "PowerTools Inc", additionalCategories: ["MRO", "Safety"] },
      
    //   // MetalWorks (Metals & Raw Materials primary category) also supplies Tools
    //   { vendorName: "MetalWorks Fabrication", additionalCategories: ["Tools"] },
      
    //   // Facility Management (Facilities primary category) also supplies Administration and Miscellaneous
    //   { vendorName: "Facility Management Solutions", additionalCategories: ["Administration", "Miscellaneous"] },
      
    //   // CapEx Equipment (Capex primary category) also supplies Metals & Raw Materials and MRO
    //   { vendorName: "CapEx Equipment Solutions", additionalCategories: ["Metals & Raw Materials", "MRO"] },
      
    //   // Office Administration (Administration primary category) also supplies IT
    //   { vendorName: "Office Administration Supplies", additionalCategories: ["IT"] },
      
    //   // MultiSupply (Miscellaneous primary category) supplies multiple categories
    //   { vendorName: "MultiSupply Ventures", additionalCategories: ["Administration", "MRO", "IT", "Facilities"] }
    // ];

    // Add the secondary category mappings
    // for (const mapping of secondaryCategoryMappings) {
    //   const vendor = vendorMap[mapping.vendorName];
    //   if (vendor) {
    //     for (const categoryName of mapping.additionalCategories) {
    //       if (categoryMap[categoryName]) {
    //         vendorCategoryMappings.push({
    //           vendorId: vendor._id,
    //           categoryId: categoryMap[categoryName],
    //           tenantId: mrfTenant._id,
    //           preferredSupplier: false, // Secondary categories are not preferred by default
    //           priceRange: {
    //             min: 0,
    //             max: 0,
    //             currency: 'INR'
    //           },
    //           notes: `Secondary category for ${vendor.name}`,
    //         });
    //       }
    //     }
    //   }
    // }

    // Step 7: Insert all mappings
    console.log(`Creating ${vendorCategoryMappings.length} vendor-category mappings...`);
    const createdMappings = await VendorCategory.insertMany(vendorCategoryMappings);

    console.log(`Successfully created ${createdMappings.length} vendor-category mappings!`);

    // Step 8: Log summary
    console.log('\n=== MRF Vendor-Category Mappings Summary ===');
    
    // Prepare summary data
    const vendorSummary = {};
    const categorySummary = {};
    
    // Initialize category counts
    categories.forEach(cat => {
      categorySummary[cat.name] = 0;
    });

    // Count mappings per vendor and per category
    for (const mapping of createdMappings) {
      const vendor = vendors.find(v => v._id.equals(mapping.vendorId));
      const category = categories.find(c => c._id.equals(mapping.categoryId));
      
      if (vendor && category) {
        // Count vendors per category
        categorySummary[category.name] = (categorySummary[category.name] || 0) + 1;
        
        // Count categories per vendor
        if (!vendorSummary[vendor.name]) {
          vendorSummary[vendor.name] = [];
        }
        vendorSummary[vendor.name].push(category.name);
      }
    }
    
    // Print vendor summary
    console.log('\nVendors and their categories:');
    Object.keys(vendorSummary).forEach(vendorName => {
      console.log(`- ${vendorName}: ${vendorSummary[vendorName].join(', ')}`);
    });
    
    // Print category summary
    console.log('\nCategories and number of supplying vendors:');
    Object.keys(categorySummary).forEach(categoryName => {
      console.log(`- ${categoryName}: ${categorySummary[categoryName]} vendors`);
    });
    
    console.log('==========================================');
    
  } catch (error) {
    console.error('Error seeding MRF vendor-category mappings:', error);
  } finally {
    // Close database connection
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedMRFVendorCategories();
