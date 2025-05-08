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
    
    console.log(`Found supplier role with ID: ${supplierRole._id}`);    // Step 3: Define suppliers
    const defaultPassword = 'Password@123';
    
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
      },
      {
        vendor: {
          name: "SafetyFirst Equipment Ltd",
          code: "SAFE-003",
          contactPerson: "Anand Mehta",
          email: "supplier3@mrf.com",
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
          tenantId: mrfTenant._id
        },
        user: {
          name: "Anand Mehta",
          email: "supplier3@mrf.com",
          password: defaultPassword,
          tenantId: mrfTenant._id,
          authType: 'local',
          position: "Sales Director",
          roles: ['Supplier'],
          roleIds: [supplierRole._id],
          active: true
        }
      },
      {
        vendor: {
          name: "ElectroPower Systems",
          code: "ELEC-004",
          contactPerson: "Sunita Rao",
          email: "supplier4@mrf.com",
          phone: "9876543213",
          address: {
            street: "234 Electric Avenue",
            city: "Pune",
            state: "Maharashtra",
            country: "India",
            postalCode: "411001"
          },
          website: "www.electropowersys.com",
          taxId: "GSTIN456789123",
          paymentTerms: "Net 15",
          category: "Electrical, Electronics & Power",
          status: "Active",
          rating: 3.8,
          notes: "Electrical equipment specialists",
          isPreferred: false,
          tenantId: mrfTenant._id
        },
        user: {
          name: "Sunita Rao",
          email: "supplier4@mrf.com",
          password: defaultPassword,
          tenantId: mrfTenant._id,
          authType: 'local',
          position: "Business Development Manager",
          roles: ['Supplier'],
          roleIds: [supplierRole._id],
          active: true
        }
      },
      {
        vendor: {
          name: "PowerTools Inc",
          code: "TOOL-005",
          contactPerson: "Ramesh Joshi",
          email: "supplier5@mrf.com",
          phone: "9876543214",
          address: {
            street: "567 Workshop Lane",
            city: "Coimbatore",
            state: "Tamil Nadu",
            country: "India",
            postalCode: "641001"
          },
          website: "www.powertools-india.com",
          taxId: "GSTIN567891234",
          paymentTerms: "Net 30",
          category: "Tools",
          status: "Active",
          rating: 4.5,
          notes: "Premium tool manufacturer and supplier",
          isPreferred: true,
          tenantId: mrfTenant._id
        },
        user: {
          name: "Ramesh Joshi",
          email: "supplier5@mrf.com",
          password: defaultPassword,
          tenantId: mrfTenant._id,
          authType: 'local',
          position: "Managing Director",
          roles: ['Supplier'],
          roleIds: [supplierRole._id],
          active: true
        }
      },
      {
        vendor: {
          name: "MetalWorks Fabrication",
          code: "METL-006",
          contactPerson: "Kiran Shah",
          email: "supplier6@mrf.com",
          phone: "9876543215",
          address: {
            street: "890 Industrial Estate",
            city: "Ahmedabad",
            state: "Gujarat",
            country: "India",
            postalCode: "380001"
          },
          website: "www.metalworksfabrication.in",
          taxId: "GSTIN678912345",
          paymentTerms: "Net 45",
          category: "Metals & Raw Materials",
          status: "Active",
          rating: 3.9,
          notes: "Custom metal fabrication and raw material supply",
          isPreferred: false,
          tenantId: mrfTenant._id
        },
        user: {
          name: "Kiran Shah",
          email: "supplier6@mrf.com",
          password: defaultPassword,
          tenantId: mrfTenant._id,
          authType: 'local',
          position: "Operations Head",
          roles: ['Supplier'],
          roleIds: [supplierRole._id],
          active: true
        }
      },
      {
        vendor: {
          name: "Facility Management Solutions",
          code: "FACL-007",
          contactPerson: "Deepa Nair",
          email: "supplier7@mrf.com",
          phone: "9876543216",
          address: {
            street: "123 Commercial Complex",
            city: "Hyderabad",
            state: "Telangana",
            country: "India",
            postalCode: "500001"
          },
          website: "www.fmsolutions.co.in",
          taxId: "GSTIN789123456",
          paymentTerms: "Net 30",
          category: "Facilities",
          status: "Active",
          rating: 4.1,
          notes: "Comprehensive facility management services",
          isPreferred: true,
          tenantId: mrfTenant._id
        },
        user: {
          name: "Deepa Nair",
          email: "supplier7@mrf.com",
          password: defaultPassword,
          tenantId: mrfTenant._id,
          authType: 'local',
          position: "Client Relationship Manager",
          roles: ['Supplier'],
          roleIds: [supplierRole._id],
          active: true
        }
      },
      {
        vendor: {
          name: "CapEx Equipment Solutions",
          code: "CAPX-008",
          contactPerson: "Vijay Menon",
          email: "supplier8@mrf.com",
          phone: "9876543217",
          address: {
            street: "456 Business Park",
            city: "Delhi",
            state: "Delhi",
            country: "India",
            postalCode: "110001"
          },
          website: "www.capexsolutions.com",
          taxId: "GSTIN891234567",
          paymentTerms: "Net 60",
          category: "Capex",
          status: "Active",
          rating: 4.7,
          notes: "Major equipment and capital expenditure specialist",
          isPreferred: true,
          tenantId: mrfTenant._id
        },
        user: {
          name: "Vijay Menon",
          email: "supplier8@mrf.com",
          password: defaultPassword,
          tenantId: mrfTenant._id,
          authType: 'local',
          position: "Senior Sales Executive",
          roles: ['Supplier'],
          roleIds: [supplierRole._id],
          active: true
        }
      },
      {
        vendor: {
          name: "Office Administration Supplies",
          code: "ADMN-009",
          contactPerson: "Meena Gupta",
          email: "supplier9@mrf.com",
          phone: "9876543218",
          address: {
            street: "789 Commerce Street",
            city: "Kolkata",
            state: "West Bengal",
            country: "India",
            postalCode: "700001"
          },
          website: "www.officesuppliesadmin.in",
          taxId: "GSTIN912345678",
          paymentTerms: "Net 15",
          category: "Administration",
          status: "Active",
          rating: 3.6,
          notes: "Office supplies and administrative products",
          isPreferred: false,
          tenantId: mrfTenant._id
        },
        user: {
          name: "Meena Gupta",
          email: "supplier9@mrf.com",
          password: defaultPassword,
          tenantId: mrfTenant._id,
          authType: 'local',
          position: "Regional Manager",
          roles: ['Supplier'],
          roleIds: [supplierRole._id],
          active: true
        }
      },
      {
        vendor: {
          name: "MultiSupply Ventures",
          code: "MULT-010",
          contactPerson: "Arjun Reddy",
          email: "supplier10@mrf.com",
          phone: "9876543219",
          address: {
            street: "101 Distribution Center",
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            postalCode: "600002"
          },
          website: "www.multisupplyventures.com",
          taxId: "GSTIN012345678",
          paymentTerms: "Net 30",
          category: "Miscellaneous",
          status: "Active",
          rating: 4.0,
          notes: "Multi-category supplier for various needs",
          isPreferred: true,
          tenantId: mrfTenant._id
        },
        user: {
          name: "Arjun Reddy",
          email: "supplier10@mrf.com",
          password: defaultPassword,
          tenantId: mrfTenant._id,
          authType: 'local',
          position: "CEO",
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
    }    console.log('\n=== MRF Suppliers Summary ===');
    console.log(`Created ${suppliers.length} suppliers with user accounts`);
    console.log('Suppliers created by category:');
    
    // Group suppliers by category for summary
    const categoryCounts = {};
    suppliers.forEach(s => {
      const category = s.vendor.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // Print category breakdown
    Object.keys(categoryCounts).forEach(category => {
      console.log(`- ${category}: ${categoryCounts[category]} supplier(s)`);
    });
    
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
