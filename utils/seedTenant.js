const mongoose = require('mongoose');
const Category = require('../models/Category');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Role = require('../models/Role');
const CostCenter = require('../models/CostCenter');
const Department = require('../models/Department');
const Location = require('../models/Location');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const VendorCategory = require('../models/VendorCategory');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// MongoDB Connection
mongoose.connect("mongodb://admin:admin@localhost:27017/SmartProcureDB").then(() => {
  console.log('MongoDB Connected...');
}).catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Helper function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Generate a random SKU
const generateSKU = (prefix, num) => {
  return `${prefix}-${Math.floor(10000 + Math.random() * 90000)}-${num}`;
};

// Generate a random part number
const generatePartNumber = () => {
  return `P-${Math.floor(100000 + Math.random() * 900000)}`;
};

const seedTenant = async () => {
  try {
    // Get tenant name from command line argument or default to 'NewTenant'
    const tenantName = process.argv[2] || 'NewTenant';
    const tenantLower = tenantName.toLowerCase();

    console.log(`Starting seed process for ${tenantName} tenant...`);    // Step 1: Find or Create Tenant
    let tenant = await Tenant.findOne({ name: tenantName });
    
    if (!tenant) {
      console.log(`${tenantName} tenant not found. Creating new tenant...`);
      
      // Hash password for tenant admin
      const adminPassword = await hashPassword('Password@123');
      
      tenant = new Tenant({
        name: tenantName,
        slug: tenantLower,
        adminEmail: `admin@${tenantLower}.com`,
        adminPassword: adminPassword,
        active: true,
        plan: 'enterprise',
        contactPhone: '9876543210',
        address: `${tenantName} Headquarters, Main Street`,
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
        country: 'India',
        allowedDomains: [`${tenantLower}.com`]
      });
      
      await tenant.save();
      console.log(`Created new ${tenantName} tenant with ID: ${tenant._id}`);
    } else {
      console.log(`Found existing ${tenantName} tenant with ID: ${tenant._id}`);
    }

    // Step 2: Create Locations
    console.log('Creating locations...');
    const locations = [
      { code: 'CHN', name: 'Chennai', address: `${tenantName} Main Office, Anna Salai`, city: 'Chennai', state: 'Tamil Nadu', country: 'India', tenantId: tenant._id },
      { code: 'BLR', name: 'Bangalore', address: `${tenantName} Office, Whitefield`, city: 'Bangalore', state: 'Karnataka', country: 'India', tenantId: tenant._id },
      { code: 'MUM', name: 'Mumbai', address: `${tenantName} Branch Office, Worli`, city: 'Mumbai', state: 'Maharashtra', country: 'India', tenantId: tenant._id }
    ];

    // Clear existing locations and create new ones
    await Location.deleteMany({ tenantId: tenant._id });
    const createdLocations = await Location.insertMany(locations);
    console.log(`${createdLocations.length} locations created`);

    // Set default location for tenant
    await Tenant.findByIdAndUpdate(tenant._id, { defaultLocationId: createdLocations[0]._id });

    // Step 3: Find Roles
    console.log('Fetching roles...');
    
    const roles = await Role.find({});
    if (roles.length === 0) {
      console.error('No roles found. Please run seedPermissionsAndRoles.js first.');
      process.exit(1);
    }

    // Map roles by code for easy access
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.code] = role._id;
    });

    // Step 4: Create Cost Centers
    console.log('Creating cost centers...');
    const costCenters = [
      { code: 'MFG-OPS', name: 'Manufacturing Operations', budget: 5000000, tenantId: tenant._id },
      { code: 'SALES-MKT', name: 'Sales & Marketing', budget: 3000000, tenantId: tenant._id },
      { code: 'CORP-ADMIN', name: 'Corporate Administration', budget: 2000000, tenantId: tenant._id },
      { code: 'RND', name: 'Research & Development', budget: 4000000, tenantId: tenant._id },
      { code: 'LOGISTICS', name: 'Supply Chain & Logistics', budget: 2500000, tenantId: tenant._id }
    ];

    // Clear existing cost centers
    await CostCenter.deleteMany({ tenantId: tenant._id });
    
    // Create cost centers (without head and approvers for now, will update after users are created)
    let createdCostCenters = [];
    for (const cc of costCenters) {
      // Temporarily set head to null
      const costCenter = new CostCenter({
        ...cc,
        head: null
      });
      await costCenter.save({ validateBeforeSave: false }); // Skip validation for head
      createdCostCenters.push(costCenter);
    }
    console.log(`${createdCostCenters.length} cost centers created`);

    // Step 5: Create Departments
    console.log('Creating departments...');
    const departments = [
      { name: 'Engineering Department', costCenterId: createdCostCenters[0]._id, tenantId: tenant._id },
      { name: 'Marketing Department', costCenterId: createdCostCenters[1]._id, tenantId: tenant._id },
      { name: 'Finance Department', costCenterId: createdCostCenters[2]._id, tenantId: tenant._id },
      { name: 'Research Department', costCenterId: createdCostCenters[3]._id, tenantId: tenant._id },
      { name: 'Logistics Department', costCenterId: createdCostCenters[4]._id, tenantId: tenant._id }
    ];

    // Clear existing departments
    await Department.deleteMany({ tenantId: tenant._id });
    
    // Create departments (without manager for now, will update after users are created)
    let createdDepartments = [];
    for (const dept of departments) {
      const department = new Department({
        ...dept,
        manager: null
      });
      await department.save({ validateBeforeSave: false }); // Skip validation for manager
      createdDepartments.push(department);
    }
    console.log(`${createdDepartments.length} departments created`);

    // Step 6: Create Users
    console.log('Creating users...');
    const defaultPassword = await hashPassword('Password@123');
    
    // Define users - Users with different roles
    const users = [
      // Admin user
      {
        name: `${tenantName} Admin`,
        email: `admin@${tenantLower}.com`,
        password: defaultPassword,
        tenantId: tenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[0]._id,
        position: 'System Administrator',
        costCenterId: createdCostCenters[2]._id, // Corporate Administration
        departmentId: createdDepartments[2]._id, // Finance Department
        approvalLimits: {
          requisition: 1000000,
          purchase: 500000
        },
        approvalHierarchy: 5,
        active: true,
        roles: ['Administrator'],
        roleIds: [roleMap.administrator]
      },
      // Requester
      {
        name: `${tenantName} Requester`,
        email: `requester@${tenantLower}.com`,
        password: defaultPassword,
        tenantId: tenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[0]._id,
        position: 'Engineering Associate',
        costCenterId: createdCostCenters[0]._id,
        departmentId: createdDepartments[0]._id,
        approvalLimits: {
          requisition: 25000,
          purchase: 10000
        },
        approvalHierarchy: 1,
        active: true,
        roles: ['Requester'],
        roleIds: [roleMap.requester]
      },
      // Approver
      {
        name: `${tenantName} Approver`,
        email: `approver@${tenantLower}.com`,
        password: defaultPassword,
        tenantId: tenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[0]._id,
        position: 'Senior Manager',
        costCenterId: createdCostCenters[0]._id,
        departmentId: createdDepartments[0]._id,
        approvalLimits: {
          requisition: 100000,
          purchase: 50000
        },
        approvalHierarchy: 3,
        active: true,
        roles: ['Approver'],
        roleIds: [roleMap.approver]
      },
      // Cost Center Head
      {
        name: `${tenantName} Cost Center Head`,
        email: `costcenterhead@${tenantLower}.com`,
        password: defaultPassword,
        tenantId: tenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[0]._id,
        position: 'Cost Center Director',
        costCenterId: createdCostCenters[0]._id,
        departmentId: createdDepartments[0]._id,
        approvalLimits: {
          requisition: 150000,
          purchase: 80000
        },
        approvalHierarchy: 4,
        active: true,
        roles: ['CostCenterHead'],
        roleIds: [roleMap.costcenter_head]
      },
      // Procurement Manager
      {
        name: `${tenantName} Procurement Manager`,
        email: `procurement@${tenantLower}.com`,
        password: defaultPassword,
        tenantId: tenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[0]._id,
        position: 'Senior Procurement Manager',
        costCenterId: createdCostCenters[4]._id,
        departmentId: createdDepartments[4]._id,
        approvalLimits: {
          requisition: 200000,
          purchase: 100000
        },
        approvalHierarchy: 4,
        active: true,
        roles: ['Procurement Manager'],
        roleIds: [roleMap.procurement_manager]
      }
    ];

    // Delete existing users for this tenant to avoid duplicates
    await User.deleteMany({ tenantId: tenant._id });
    
    // Insert users - using insertMany to bypass the password hashing (already hashed)
    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created`);

    // Step 7: Create Categories
    console.log('Creating categories...');
    const categoryData = [
      {
        "name": "Administration",
        "ancestors": [],
        "parent": null,
        "level": 0,
        "tenantId": tenant._id,
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
        "tenantId": tenant._id,
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
        "tenantId": tenant._id,
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
        "tenantId": tenant._id,
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
        "tenantId": tenant._id,
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
        "tenantId": tenant._id,
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
        "tenantId": tenant._id,
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
        "tenantId": tenant._id,
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
        "tenantId": tenant._id,
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
        "tenantId": tenant._id,
        "attributes": {
          "items": 315
        },
        "image": "/images/Miscellaneous.jpg",
        "description": "Other industrial and office supplies"
      }
    ];

    // Delete existing categories for this tenant to avoid duplicates
    console.log('Deleting existing categories...');
    await Category.deleteMany({ tenantId: tenant._id });

    // Create new categories
    console.log('Creating new categories...');
    const createdCategories = await Category.insertMany(categoryData);

    console.log(`Successfully created ${createdCategories.length} categories for ${tenantName} tenant!`);
    
    // Create a map of category names to IDs for easier lookup
    const categoryMap = {};
    createdCategories.forEach(category => {
      categoryMap[category.name] = category._id;
    });

    // Step 8: Create Products
    console.log('Creating products...');
    
    // Define products by category
    const productsByCategory = {
      'Administration': [
        { name: 'Premium Notebook', shortDescription: 'Hardcover A4 notebook with premium paper', brand: 'PaperMate' },
        { name: 'Ergonomic Desk Chair', shortDescription: 'Adjustable office chair with lumbar support', brand: 'Steelcase' },
        { name: 'Stapler Set', shortDescription: 'Heavy-duty stapler with 1000 staples', brand: 'Rapid' }
      ],
      'Safety': [
        { name: 'Safety Goggles', shortDescription: 'Anti-fog safety goggles with UV protection', brand: '3M' },
        { name: 'Hard Hat', shortDescription: 'Type II hard hat with ratchet adjustment', brand: 'MSA' },
        { name: 'First Aid Kit', shortDescription: 'Comprehensive first aid kit for workplace', brand: 'Johnson & Johnson' }
      ],
      'Electrical, Electronics & Power': [
        { name: 'Circuit Breaker', shortDescription: '30A single-pole circuit breaker', brand: 'Schneider Electric' },
        { name: 'Power Supply', shortDescription: '500W ATX power supply', brand: 'Corsair' },
        { name: 'Multimeter', shortDescription: 'Digital multimeter with auto-ranging', brand: 'Fluke' }
      ],
      'Tools': [
        { name: 'Drill Set', shortDescription: '18V cordless drill with accessories', brand: 'DeWalt' },
        { name: 'Wrench Set', shortDescription: 'Metric combination wrench set', brand: 'Craftsman' },
        { name: 'Hammer', shortDescription: '16oz claw hammer with fiberglass handle', brand: 'Stanley' }
      ],
      'IT': [
        { name: 'Desktop Computer', shortDescription: 'Business desktop with i7 processor', brand: 'Dell' },
        { name: 'Laptop', shortDescription: '14" business laptop with SSD', brand: 'Lenovo' },
        { name: 'Network Switch', shortDescription: '24-port gigabit managed switch', brand: 'Cisco' }
      ]
    };

    // Delete existing products for this tenant
    await Product.deleteMany({ tenantId: tenant._id.toString() });

    // Create products for each category
    let totalProducts = 0;
    const allProducts = [];

    for (const category of createdCategories) {
      const categoryName = category.name;
      const productsForCategory = productsByCategory[categoryName] || [];
      
      if (productsForCategory.length === 0) {
        // If no specific products defined for this category, create a generic one
        const genericProduct = {
          name: `${categoryName} Item`,
          shortDescription: `Standard ${categoryName} item`,
          brand: 'Generic'
        };
        productsForCategory.push(genericProduct);
      }

      for (let i = 0; i < productsForCategory.length; i++) {
        const product = productsForCategory[i];
        const price = 100 + Math.floor(Math.random() * 900);
        const discount = Math.floor(Math.random() * 30);
        const mrp = price + Math.floor(price * 0.2);
        
        const newProduct = {
          name: product.name,
          shortDescription: product.shortDescription,
          description: `Detailed description for ${product.name}. This is a high-quality product used in industrial and commercial settings.`,
          brand: product.brand,
          category: categoryName,
          categoryId: category._id,
          categoryPath: [categoryName],
          discount: discount,
          images: ['/images/products/default.jpg'],
          inStock: Math.random() > 0.2, // 80% chance to be in stock
          isPopular: Math.random() > 0.7, // 30% chance to be popular
          mrp: mrp,
          price: price,
          partNumber: generatePartNumber(),
          ratings: {
            average: (3 + Math.random() * 2).toFixed(1), // Rating between 3 and 5
            count: Math.floor(10 + Math.random() * 90) // Between 10 and 100 ratings
          },
          sku: generateSKU(categoryName.substring(0, 3).toUpperCase(), i + 1),
          specifications: {
            Material: "Various",
            Dimensions: "Standard",
            Weight: "Product specific",
            Certification: "ISO 9001"
          },
          stockQuantity: Math.floor(10 + Math.random() * 90), // Random stock between 10-100
          subCategory: categoryName, // Using the same as category for now
          tags: [categoryName, product.brand, product.name.split(' ')[0]], // Basic tagging
          thumbnailUrl: '/images/products/thumbnail-default.jpg',
          manufacturer: product.brand,
          unit: 'Each',
          tenantId: tenant._id.toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        allProducts.push(newProduct);
        totalProducts++;
      }
    }

    // Insert all products at once
    if (allProducts.length > 0) {
      await Product.insertMany(allProducts);
      console.log(`Successfully created ${totalProducts} products across ${createdCategories.length} categories!`);
    } else {
      console.log('No products were created.');
    }

    // Step 9: Create Suppliers
    console.log('Creating suppliers...');
    
    // Find the supplier role
    const supplierRole = roles.find(role => role.code === 'supplier');
    
    if (!supplierRole) {
      console.error('Supplier role not found. Please run seedPermissionsAndRoles.js first.');
      process.exit(1);
    }
    
    console.log(`Found supplier role with ID: ${supplierRole._id}`);
    
    // Define suppliers for different categories
    const suppliersData = [
      {
        name: "TechComponents Ltd",
        code: "TECH-001",
        contactPerson: "Rajesh Kumar",
        email: `supplier1@${tenantLower}.com`,
        phone: "9876543210",
        address: {
          street: "123 Tech Park",
          city: "Bangalore",
          state: "Karnataka",
          country: "India",
          postalCode: "560001"
        },
        website: "www.techcomponents.com",
        taxId: "GSTIN123456789",
        paymentTerms: "Net 30",
        category: "IT",
        status: "Active",
        rating: 4,
        notes: "Preferred supplier for electronic components",
        isPreferred: true,
        tenantId: tenant._id
      },
      {
        name: "SafetyFirst Equipment Ltd",
        code: "SAFE-002",
        contactPerson: "Anand Mehta",
        email: `supplier2@${tenantLower}.com`,
        phone: "9876543212",
        address: {
          street: "789 Safety Complex",
          city: "Mumbai",
          state: "Maharashtra",
          country: "India",
          postalCode: "400001"
        },
        website: "www.safetyfirstindia.com",
        taxId: "GSTIN345678912",
        paymentTerms: "Net 30",
        category: "Safety",
        status: "Active",
        rating: 4.2,
        notes: "Top safety equipment provider",
        isPreferred: true,
        tenantId: tenant._id
      },
      {
        name: "Office Administration Supplies",
        code: "ADMIN-003",
        contactPerson: "Meena Gupta",
        email: `supplier3@${tenantLower}.com`,
        phone: "9876543213",
        address: {
          street: "456 Business District",
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          postalCode: "600001"
        },
        website: "www.officeadmin.com",
        taxId: "GSTIN456789123",
        paymentTerms: "Net 15",
        category: "Administration",
        status: "Active",
        rating: 3.8,
        notes: "Complete office supply solutions",
        isPreferred: false,
        tenantId: tenant._id
      }
    ];

    // Delete existing suppliers for this tenant
    await Vendor.deleteMany({ tenantId: tenant._id });
    
    // Create suppliers and their user accounts
    const createdSuppliers = [];
    const suppliersByCategory = {};
    
    for (let i = 0; i < suppliersData.length; i++) {
      const supplierData = suppliersData[i];
      
      // Create vendor record
      const vendor = new Vendor(supplierData);
      await vendor.save();
      console.log(`Created vendor: ${vendor.name} (${vendor._id})`);
      
      createdSuppliers.push(vendor);
      
      // Track suppliers by category for summary
      if (!suppliersByCategory[vendor.category]) {
        suppliersByCategory[vendor.category] = 0;
      }
      suppliersByCategory[vendor.category]++;
      
      // Create user account for this supplier
      const user = new User({
        name: supplierData.contactPerson,
        email: supplierData.email,
        password: defaultPassword,
        tenantId: tenant._id,
        vendorId: vendor._id, // Link to vendor record
        authType: 'local',
        position: "Vendor Representative",
        roles: ['Supplier'],
        roleIds: [supplierRole._id],
        active: true
      });
      
      await user.save();
      console.log(`Created supplier user: ${user.name} (${user._id})`);
      
      // Update vendor with the user ID as createdBy
      vendor.createdBy = user._id;
      await vendor.save();
    }

    // Step 10: Create Vendor-Category mappings
    console.log('Creating vendor-category mappings...');
    
    // Delete existing mappings for this tenant
    await VendorCategory.deleteMany({ tenantId: tenant._id });
    
    // Create mappings
    const vendorCategoryMappings = [];
    for (const vendor of createdSuppliers) {
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
    
    // Insert all mappings
    if (vendorCategoryMappings.length > 0) {
      const createdMappings = await VendorCategory.insertMany(vendorCategoryMappings);
      console.log(`Successfully created ${createdMappings.length} vendor-category mappings!`);
    }

    // Step 11: Update Cost Centers with heads and Departments with managers
    console.log('Updating cost centers and departments with managers...');
    
    const costCenterHeadUser = createdUsers.find(user => user.roles.includes('CostCenterHead'));
    
    if (costCenterHeadUser) {
      // Update all cost centers with the same head (for demo purposes)
      for (const costCenter of createdCostCenters) {
        await CostCenter.findByIdAndUpdate(costCenter._id, { 
          head: costCenterHeadUser._id,
          $push: {
            approvers: {
              userId: costCenterHeadUser._id,
              level: 1
            }
          }
        });
      }
      
      // Update all departments with the same manager (for demo purposes)
      for (const department of createdDepartments) {
        await Department.findByIdAndUpdate(department._id, { 
          manager: costCenterHeadUser._id
        });
      }
      
      console.log('Updated cost centers and departments with managers');
    }

    // Final Summary
    console.log(`\n\n========= ${tenantName} tenant is now set up with: =========`);
    console.log('- System permissions and roles');
    console.log(`- ${tenantName} tenant with admin user`);
    console.log(`- ${createdUsers.length} users with different roles`);
    console.log('- Cost centers, departments, and locations');
    console.log(`- ${createdCategories.length} categories for procurement`);
    console.log(`- ${totalProducts} products across all categories`);
    console.log(`- ${createdSuppliers.length} suppliers with user accounts`);
    console.log('\nYou can now log in with the following credentials:');
    console.log(`Email: admin@${tenantLower}.com`);
    console.log('Password: Password@123');
    
    // Log suppliers by category
    console.log('\nSuppliers created by category:');
    for (const category in suppliersByCategory) {
      console.log(`- ${category}: ${suppliersByCategory[category]} supplier(s)`);
    }
    
    console.log('\n============================');
    console.log('Common Password for all users: Password@123');
    
  } catch (error) {
    console.error(`Error seeding ${process.argv[2] || 'NewTenant'} tenant:`, error);
  } finally {
    // Close database connection
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Execute seed function
seedTenant();
