const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Tenant = require('../models/Tenant');
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

// Generate a random SKU
const generateSKU = (prefix, num) => {
  return `${prefix}-${Math.floor(10000 + Math.random() * 90000)}-${num}`;
};

// Generate a random part number
const generatePartNumber = () => {
  return `P-${Math.floor(100000 + Math.random() * 900000)}`;
};

const seedMRFProducts = async () => {
  try {
    console.log('Starting MRF products seeding...');

    // Step 1: Find MRF Tenant
    const mrfTenant = await Tenant.findOne({ name: 'MRF' });
    
    if (!mrfTenant) {
      console.error('MRF tenant not found. Please run seedMRFData.js first.');
      process.exit(1);
    }
    
    console.log(`Found MRF tenant with ID: ${mrfTenant._id}`);

    // Step 2: Get all categories for this tenant
    const categories = await Category.find({ tenantId: mrfTenant._id });
    
    if (categories.length === 0) {
      console.error('No categories found for MRF tenant. Please run seedMRFCategories.js first.');
      process.exit(1);
    }
    
    console.log(`Found ${categories.length} categories for MRF tenant.`);

    // Step 3: Define products by category
    const productsByCategory = {
      'Administration': [
        { name: 'Premium Notebook', shortDescription: 'Hardcover A4 notebook with premium paper', brand: 'PaperMate' },
        { name: 'Ergonomic Desk Chair', shortDescription: 'Adjustable office chair with lumbar support', brand: 'Steelcase' },
        { name: 'Stapler Set', shortDescription: 'Heavy-duty stapler with 1000 staples', brand: 'Rapid' },
        { name: 'File Cabinet', shortDescription: '4-drawer lockable filing cabinet', brand: 'HON' },
        { name: 'Paper Shredder', shortDescription: 'Cross-cut paper shredder with 10-sheet capacity', brand: 'Fellowes' }
      ],
      'Safety': [
        { name: 'Safety Goggles', shortDescription: 'Anti-fog safety goggles with UV protection', brand: '3M' },
        { name: 'Hard Hat', shortDescription: 'Type II hard hat with ratchet adjustment', brand: 'MSA' },
        { name: 'First Aid Kit', shortDescription: 'Comprehensive first aid kit for workplace', brand: 'Johnson & Johnson' },
        { name: 'Fire Extinguisher', shortDescription: 'ABC dry chemical fire extinguisher', brand: 'Kidde' },
        { name: 'Safety Vest', shortDescription: 'High-visibility reflective safety vest', brand: 'Reflective Inc' }
      ],
      'Electrical, Electronics & Power': [
        { name: 'Circuit Breaker', shortDescription: '30A single-pole circuit breaker', brand: 'Schneider Electric' },
        { name: 'Power Supply', shortDescription: '500W ATX power supply', brand: 'Corsair' },
        { name: 'Multimeter', shortDescription: 'Digital multimeter with auto-ranging', brand: 'Fluke' },
        { name: 'UPS System', shortDescription: '1500VA backup UPS system', brand: 'APC' },
        { name: 'LED Light Panel', shortDescription: '24W 2x2 recessed LED panel', brand: 'Philips' },
        { name: 'Electrical Wire Bundle', shortDescription: '12-gauge copper wire, 100ft', brand: 'Southwire' }
      ],
      'Tools': [
        { name: 'Drill Set', shortDescription: '18V cordless drill with accessories', brand: 'DeWalt' },
        { name: 'Wrench Set', shortDescription: 'Metric combination wrench set', brand: 'Craftsman' },
        { name: 'Hammer', shortDescription: '16oz claw hammer with fiberglass handle', brand: 'Stanley' },
        { name: 'Circular Saw', shortDescription: '7-1/4" circular saw with laser guide', brand: 'Makita' },
        { name: 'Tool Box', shortDescription: 'Heavy-duty rolling tool box with drawers', brand: 'Milwaukee' }
      ],
      'Metals & Raw Materials': [
        { name: 'Aluminum Sheet', shortDescription: '4x8 0.125" aluminum sheet', brand: 'Alcoa' },
        { name: 'Steel Bar', shortDescription: '1" round steel bar, 6ft length', brand: 'US Steel' },
        { name: 'Copper Wire', shortDescription: '10-gauge copper wire, 500ft spool', brand: 'Cerrowire' },
        { name: 'PVC Pipe', shortDescription: '3" schedule 40 PVC pipe, 10ft length', brand: 'Charlotte Pipe' },
        { name: 'Rubber Sheet', shortDescription: '1/4" thick rubber sheet, 3x3ft', brand: 'Grainger' }
      ],
      'MRO': [
        { name: 'Air Filter', shortDescription: 'MERV 13 HVAC air filter, 20x25x1', brand: 'Filtrete' },
        { name: 'Hydraulic Oil', shortDescription: 'Premium hydraulic oil, 5 gallon', brand: 'Mobil' },
        { name: 'V-Belt', shortDescription: 'V-belt for industrial machinery, 5L 60"', brand: 'Gates' },
        { name: 'Bearing Assembly', shortDescription: 'Pillow block bearing, 1" shaft', brand: 'SKF' },
        { name: 'Industrial Lubricant', shortDescription: 'Multi-purpose grease, 14oz cartridge', brand: 'WD-40' }
      ],
      'IT': [
        { name: 'Desktop Computer', shortDescription: 'Business desktop with i7 processor', brand: 'Dell' },
        { name: 'Laptop', shortDescription: '14" business laptop with SSD', brand: 'Lenovo' },
        { name: 'Network Switch', shortDescription: '24-port gigabit managed switch', brand: 'Cisco' },
        { name: 'Wireless Router', shortDescription: 'Dual-band enterprise WiFi router', brand: 'Netgear' },
        { name: 'External Hard Drive', shortDescription: '2TB USB 3.0 external hard drive', brand: 'Western Digital' },
        { name: 'Printer', shortDescription: 'Color laser printer with networking', brand: 'HP' }
      ],
      'Facilities': [
        { name: 'HVAC Filter', shortDescription: 'Commercial HVAC filter replacement', brand: 'Honeywell' },
        { name: 'Industrial Cleaning Solution', shortDescription: 'Floor cleaning concentrate, 1 gallon', brand: 'Simple Green' },
        { name: 'Fluorescent Light Bulb', shortDescription: 'T8 4ft fluorescent tube, 32W', brand: 'GE' },
        { name: 'Door Lock Set', shortDescription: 'Commercial grade door lock with keys', brand: 'Schlage' },
        { name: 'Smoke Detector', shortDescription: 'Hardwired smoke detector with battery backup', brand: 'Kidde' }
      ],
      'Capex': [
        { name: 'CNC Machine', shortDescription: '3-axis CNC milling machine', brand: 'Haas' },
        { name: 'Industrial Printer', shortDescription: 'Wide-format industrial printer', brand: 'Epson' },
        { name: 'Server Rack', shortDescription: '42U server rack enclosure', brand: 'APC' },
        { name: 'Transport Vehicle', shortDescription: 'Electric forklift, 5000lb capacity', brand: 'Toyota' },
        { name: 'Production Line Equipment', shortDescription: 'Automated packaging system', brand: 'ABB' }
      ],
      'Miscellaneous': [
        { name: 'Shipping Boxes', shortDescription: 'Corrugated shipping boxes, 12x12x12', brand: 'Uline' },
        { name: 'Cable Management', shortDescription: 'Cable management system for office', brand: 'Panduit' },
        { name: 'Storage Bins', shortDescription: 'Stackable plastic storage bins', brand: 'Akro-Mils' },
        { name: 'Security Camera', shortDescription: 'IP security camera with night vision', brand: 'Hikvision' },
        { name: 'Industrial Fan', shortDescription: '36" high-velocity industrial fan', brand: 'Global Industrial' }
      ]
    };

    // Step 4: Delete existing products for this tenant
    console.log('Deleting existing products...');
    await Product.deleteMany({ tenantId: mrfTenant._id.toString() });

    // Step 5: Create products for each category
    console.log('Creating new products...');
    let totalProducts = 0;
    const allProducts = [];

    for (const category of categories) {
      const categoryName = category.name;
      const productsForCategory = productsByCategory[categoryName] || [];
      
      if (productsForCategory.length === 0) {
        console.log(`No product templates defined for category: ${categoryName}`);
        continue;
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
            Certification: "ISO 9001",
            // Additional specifications that might be used in the system
            Adjustable: Math.random() > 0.5 ? "Yes" : "No",
            Features: "Standard Features",
            Finish: "Factory Standard",
            Size: "Standard Size",
            Type: "Industrial Grade",
            Warranty: "1 Year Limited"
          },
          stockQuantity: Math.floor(10 + Math.random() * 90), // Random stock between 10-100
          subCategory: categoryName, // Using the same as category for now
          tags: [categoryName, product.brand, product.name.split(' ')[0]], // Basic tagging
          thumbnailUrl: '/images/products/thumbnail-default.jpg',
          manufacturer: product.brand,
          unit: 'Each',
          tenantId: mrfTenant._id.toString(),
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
      console.log(`Successfully created ${totalProducts} products across ${categories.length} categories!`);
    } else {
      console.log('No products were created.');
    }

    // Step 6: Log summary
    console.log('\n=== MRF Products Summary ===');
    for (const category of categories) {
      const productCount = allProducts.filter(p => p.categoryId.toString() === category._id.toString()).length;
      console.log(`- ${category.name}: ${productCount} products`);
    }
    
    console.log('============================');

  } catch (error) {
    console.error('Error seeding MRF products:', error);
  } finally {
    // Close database connection
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedMRFProducts();
