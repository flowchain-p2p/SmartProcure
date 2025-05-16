const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const VendorCategory = require('../models/VendorCategory');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables with correct path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Connected...');
}).catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

const seedTenantVendorCategories = async () => {
  try {
    console.log('Starting vendor-category mapping seeding...');

    // Get tenant name from command line argument, default to 'MRF'
    const tenantName = process.argv[2] || 'MRF';
    const tenantSlug = tenantName.toLowerCase();

    // Step 1: Find the tenant dynamically
    const tenant = await Tenant.findOne({ name: tenantName });
    if (!tenant) {
      console.error(`${tenantName} tenant not found. Please run seedTenantData.js first.`);
      process.exit(1);
    }
    
    console.log(`Found ${tenantName} tenant with ID: ${tenant._id}`);

    // Step 2: Get all tenant vendors
    const vendors = await Vendor.find({ tenantId: tenant._id });
    if (vendors.length === 0) {
      console.error(`No vendors found for ${tenantName} tenant. Please run seedTenantSuppliers.js first.`);
      process.exit(1);
    }
    console.log(`Found ${vendors.length} vendors for ${tenantName} tenant`);

    // Step 3: Get all tenant categories
    const categories = await Category.find({ tenantId: tenant._id });
    if (categories.length === 0) {
      console.error(`No categories found for ${tenantName} tenant. Please run seedTenantCategories.js first.`);
      process.exit(1);
    }
    console.log(`Found ${categories.length} categories for ${tenantName} tenant`);

    // Create a map of category names to IDs for easier lookup
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name] = category._id;
    });

    // Step 4: Delete existing vendor-category mappings for this tenant to avoid duplicates
    console.log('Deleting existing vendor-category mappings...');
    await VendorCategory.deleteMany({ tenantId: tenant._id });

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
          tenantId: tenant._id,
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
    //           tenantId: tenant._id,
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
    console.log('\n=== Vendor-Category Mappings Summary ===');
    
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
    console.error('Error seeding vendor-category mappings:', error);
  } finally {
    // Close database connection
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedTenantVendorCategories();
