const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Category = require('../models/Category');
const Product = require('../models/Product');
const UnitOfMeasure = require('../models/UnitOfMeasure');
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

const seedTenantProducts = async () => {
  try {
    console.log(`Starting ${tenantName} products seeding...`);

    // Step 1: Find tenant
    const tenant = await Tenant.findOne({ name: tenantName });
    if (!tenant) {
      console.error(`${tenantName} tenant not found. Please run seedTenantData.js first.`);
      process.exit(1);
    }
    
    console.log(`Found ${tenantName} tenant with ID: ${tenant._id}`);

    // Step 2: Find categories for this tenant
    const categories = await Category.find({ tenantId: tenant._id });
    if (categories.length === 0) {
      console.error(`No categories found for ${tenantName} tenant. Please run seedTenantCategories.js first.`);
      process.exit(1);
    }
    
    console.log(`Found ${categories.length} categories for ${tenantName} tenant`);

    // Step 3: Create or find units of measure
    console.log('Setting up units of measure...');
    const uomData = [
      { code: 'EA', name: 'Each', description: 'Individual item', tenantId: tenant._id },
      { code: 'BOX', name: 'Box', description: 'Box containing multiple items', tenantId: tenant._id },
      { code: 'KG', name: 'Kilogram', description: 'Metric weight measure', tenantId: tenant._id },
      { code: 'L', name: 'Liter', description: 'Metric volume measure', tenantId: tenant._id },
      { code: 'M', name: 'Meter', description: 'Metric length measure', tenantId: tenant._id },
      { code: 'DOZ', name: 'Dozen', description: 'Twelve items', tenantId: tenant._id },
      { code: 'HR', name: 'Hour', description: 'Time in hours', tenantId: tenant._id },
      { code: 'DAY', name: 'Day', description: 'Time in days', tenantId: tenant._id },
      { code: 'PACK', name: 'Pack', description: 'Package of items', tenantId: tenant._id },
      { code: 'SET', name: 'Set', description: 'A complete set of items', tenantId: tenant._id }
    ];

    // Delete existing UOMs for this tenant to avoid duplicates
    await UnitOfMeasure.deleteMany({ tenantId: tenant._id });
    
    // Create UOMs
    const uoms = await UnitOfMeasure.insertMany(uomData);
    console.log(`Created ${uoms.length} units of measure`);

    // Create a map for easy lookup of UOMs by code
    const uomMap = {};
    uoms.forEach(uom => {
      uomMap[uom.code] = uom._id;
    });

    // Create a map for easy lookup of categories by name
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name] = category._id;
    });

    // Step 4: Define products
    console.log('Creating products...');

    // Helper to generate SKUs with tenant slug prefix
    const generateSKU = (category, index) => {
      const categoryCode = category.name.substring(0, 3).toUpperCase();
      return `${tenantSlug.toUpperCase()}-${categoryCode}-${String(index).padStart(3, '0')}`;
    };

    // Define products across various categories
    let allProducts = [];
    let skuCounter = 1;

    // Office Supplies products
    if (categoryMap['Office Supplies']) {
      const officeSuppliesProducts = [
        {
          name: 'Premium Ballpoint Pens (Pack of 10)',
          description: 'Smooth writing ballpoint pens with medium point. Blue ink.',
          sku: generateSKU({name: 'Office Supplies'}, skuCounter++),
          price: 120,
          unitOfMeasureId: uomMap['PACK'],
          categoryId: categoryMap['Office Supplies'],
          tenantId: tenant._id,
          isActive: true,
          inStock: true,
          attributes: {
            brand: 'PenMaster',
            color: 'Blue',
            material: 'Plastic'
          },
          image: '/uploads/products/ballpoint-pens.jpg',
          tags: ['pen', 'office', 'writing']
        },
        {
          name: 'Premium A4 Paper (500 sheets)',
          description: 'High-quality 80gsm white A4 paper for printing and photocopying.',
          sku: generateSKU({name: 'Office Supplies'}, skuCounter++),
          price: 350,
          unitOfMeasureId: uomMap['BOX'],
          categoryId: categoryMap['Office Supplies'],
          tenantId: tenant._id,
          isActive: true,
          inStock: true,
          attributes: {
            brand: 'PaperPro',
            color: 'White',
            weight: '80gsm',
            size: 'A4'
          },
          image: '/uploads/products/a4-paper.jpg',
          tags: ['paper', 'printing', 'office']
        },
        {
          name: 'Desktop Stapler',
          description: 'Heavy-duty desktop stapler with 20-sheet capacity.',
          sku: generateSKU({name: 'Office Supplies'}, skuCounter++),
          price: 250,
          unitOfMeasureId: uomMap['EA'],
          categoryId: categoryMap['Office Supplies'],
          tenantId: tenant._id,
          isActive: true,
          inStock: true,
          attributes: {
            brand: 'OfficeMax',
            color: 'Black',
            capacity: '20 sheets'
          },
          image: '/uploads/products/stapler.jpg',
          tags: ['stapler', 'office', 'desk']
        }
      ];
      
      allProducts = [...allProducts, ...officeSuppliesProducts];
    }

    // IT Equipment products
    if (categoryMap['IT Equipment']) {
      const itEquipmentProducts = [
        {
          name: 'Business Laptop 15"',
          description: 'High-performance laptop with 15" display, 16GB RAM, 512GB SSD',
          sku: generateSKU({name: 'IT Equipment'}, skuCounter++),
          price: 85000,
          unitOfMeasureId: uomMap['EA'],
          categoryId: categoryMap['IT Equipment'],
          tenantId: tenant._id,
          isActive: true,
          inStock: true,
          attributes: {
            brand: 'TechPro',
            processor: 'Intel Core i7',
            ram: '16GB',
            storage: '512GB SSD',
            display: '15.6" FHD'
          },
          image: '/uploads/products/business-laptop.jpg',
          tags: ['laptop', 'computer', 'it', 'hardware']
        },
        {
          name: '27" Monitor',
          description: '27-inch LED monitor with 4K resolution and adjustable stand.',
          sku: generateSKU({name: 'IT Equipment'}, skuCounter++),
          price: 32000,
          unitOfMeasureId: uomMap['EA'],
          categoryId: categoryMap['IT Equipment'],
          tenantId: tenant._id,
          isActive: true,
          inStock: true,
          attributes: {
            brand: 'ViewMax',
            display: '27" 4K',
            resolution: '3840x2160',
            ports: 'HDMI, DisplayPort, USB-C'
          },
          image: '/uploads/products/monitor-4k.jpg',
          tags: ['monitor', 'display', 'it', 'hardware']
        }
      ];
      
      allProducts = [...allProducts, ...itEquipmentProducts];
    }

    // Furniture products
    if (categoryMap['Furniture']) {
      const furnitureProducts = [
        {
          name: 'Ergonomic Office Chair',
          description: 'Adjustable ergonomic chair with lumbar support and mesh back.',
          sku: generateSKU({name: 'Furniture'}, skuCounter++),
          price: 12000,
          unitOfMeasureId: uomMap['EA'],
          categoryId: categoryMap['Furniture'],
          tenantId: tenant._id,
          isActive: true,
          inStock: true,
          attributes: {
            brand: 'ComfortSeating',
            color: 'Black',
            material: 'Mesh and Nylon',
            adjustable: 'Yes'
          },
          image: '/uploads/products/ergonomic-chair.jpg',
          tags: ['chair', 'furniture', 'ergonomic', 'office']
        },
        {
          name: 'Executive Desk',
          description: 'Modern executive desk with drawers and cable management system.',
          sku: generateSKU({name: 'Furniture'}, skuCounter++),
          price: 25000,
          unitOfMeasureId: uomMap['EA'],
          categoryId: categoryMap['Furniture'],
          tenantId: tenant._id,
          isActive: true,
          inStock: true,
          attributes: {
            brand: 'OfficePro',
            material: 'Engineered Wood',
            color: 'Dark Brown',
            dimensions: '160x80x75cm'
          },
          image: '/uploads/products/executive-desk.jpg',
          tags: ['desk', 'furniture', 'office']
        }
      ];
      
      allProducts = [...allProducts, ...furnitureProducts];
    }

    // Add more products for each category
    // For brevity, I'm including just a few examples per category
    // In a real implementation, you would add more products

    // Delete existing products for this tenant
    await Product.deleteMany({ tenantId: tenant._id });
    
    // Create products
    const createdProducts = await Product.insertMany(allProducts);
    console.log(`Created ${createdProducts.length} products across ${categories.length} categories`);

    // Group products by category for summary
    const categoryCounts = {};
    allProducts.forEach(product => {
      const categoryId = product.categoryId.toString();
      categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
    });
    
    // Print summary
    console.log(`\n=== ${tenantName} Products Summary ===`);
    console.log(`Total Products: ${createdProducts.length}`);
    console.log('Products by category:');
    
    for (const categoryId in categoryCounts) {
      const category = categories.find(cat => cat._id.toString() === categoryId);
      if (category) {
        console.log(`- ${category.name}: ${categoryCounts[categoryId]} product(s)`);
      }
    }
    
    console.log('============================');
    
  } catch (error) {
    console.error(`Error seeding ${tenantName} products:`, error);
  } finally {
    // Close database connection
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedTenantProducts();
