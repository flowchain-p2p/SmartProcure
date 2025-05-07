const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Role = require('../models/Role');
const Vendor = require('../models/Vendor');
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

// Helper function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const seedMRFSuppliers = async () => {
  try {
    console.log('Starting MRF suppliers seeding...');

    // Step 1: Find MRF Tenant
    const mrfTenant = await Tenant.findOne({ name: 'MRF' });
    
    if (!mrfTenant) {
      console.error('MRF tenant not found. Please run seedMRFData.js first.');
      process.exit(1);
    }
    
    console.log(`Found MRF tenant with ID: ${mrfTenant._id}`);

    // Step 2: Get the supplier role
    const systemTenant = await Tenant.findOne({ slug: 'system' });
    if (!systemTenant) {
      console.error('System tenant not found. Please run seedPermissionsAndRoles.js first.');
      process.exit(1);
    }

    const supplierRole = await Role.findOne({ 
      tenantId: systemTenant._id, 
      code: 'supplier' 
    });
    
    if (!supplierRole) {
      console.error('Supplier role not found. Please run seedPermissionsAndRoles.js first.');
      process.exit(1);
    }
    
    console.log(`Found supplier role with ID: ${supplierRole._id}`);

    // Step 3: Define suppliers
    const defaultPassword = await hashPassword('Password@123');
    
    const suppliers = [
      {
        vendor: {
          name: "TechComponents Ltd",
          code: "TECH-001",
          contactPerson: "Rajesh Kumar",
          email: "supplier1@mrf.com",
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
          tenantId: mrfTenant._id
        },
        user: {
          name: "Rajesh Kumar",
          email: "supplier1@mrf.com",
          password: defaultPassword,
          tenantId: mrfTenant._id,
          authType: 'local',
          position: "Vendor Representative",
          roles: ['Supplier'],
          roleIds: [supplierRole._id],
          active: true
        }
      },
      {
        vendor: {
          name: "Industrial Solutions Pvt Ltd",
          code: "INDUS-002",
          contactPerson: "Priya Singh",
          email: "supplier2@mrf.com",
          phone: "9876543211",
          address: {
            street: "456 Industrial Area",
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            postalCode: "600001"
          },
          website: "www.industrialsolutions.com",
          taxId: "GSTIN987654321",
          paymentTerms: "Net 45",
          category: "MRO",
          status: "Active",
          rating: 3.5,
          notes: "Reliable supplier for industrial equipment",
          isPreferred: false,
          tenantId: mrfTenant._id
        },
        user: {
          name: "Priya Singh",
          email: "supplier2@mrf.com",
          password: defaultPassword,
          tenantId: mrfTenant._id,
          authType: 'local',
          position: "Account Manager",
          roles: ['Supplier'],
          roleIds: [supplierRole._id],
          active: true
        }
      }
    ];

    // Step 4: Create vendors and associated user accounts
    console.log('Creating suppliers...');
    
    // Clear existing suppliers with these emails to avoid duplicates
    for (const supplier of suppliers) {
      await User.deleteOne({ email: supplier.user.email, tenantId: mrfTenant._id });
      await Vendor.deleteOne({ email: supplier.vendor.email, tenantId: mrfTenant._id });
    }
    
    // Create suppliers
    for (const supplier of suppliers) {
      // Create vendor
      const vendorDoc = await Vendor.create(supplier.vendor);
      console.log(`Created vendor: ${vendorDoc.name} (${vendorDoc._id})`);
      
      // Create user account for the vendor
      const userDoc = await User.create({
        ...supplier.user,
        // Link to the vendor record
        vendorId: vendorDoc._id
      });
      console.log(`Created supplier user: ${userDoc.name} (${userDoc._id})`);
      
      // Update vendor with the user ID as createdBy
      await Vendor.findByIdAndUpdate(vendorDoc._id, { createdBy: userDoc._id });
    }

    console.log('\n=== MRF Suppliers Summary ===');
    console.log(`Created ${suppliers.length} suppliers with user accounts`);
    console.log('============================');
    console.log('Common Password for all supplier users: Password@123');
    
  } catch (error) {
    console.error('Error seeding MRF suppliers:', error);
  } finally {
    // Close database connection
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedMRFSuppliers();
