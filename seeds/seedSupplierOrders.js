const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SupplierOrder = require('../models/SupplierOrder');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const bcrypt = require('bcryptjs');
const Role = require('../models/Role');

// Load environment variables
dotenv.config();

// MongoDB connection
mongoose.connect("mongodb://admin:admin@localhost:27017/SmartProcureDB");

const seedData = async () => {
  try {
    console.log('Starting to seed supplier order data...');
    
    // Find or create the MRF tenant
    let mrfTenant = await Tenant.findOne({ slug: 'mrf' });
    if (!mrfTenant) {
      console.log('MRF tenant not found. Creating MRF tenant...');
      
      // Hash password before saving
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      mrfTenant = await Tenant.create({
        name: 'MRF Limited',
        slug: 'mrf',
        adminEmail: 'admin@mrf.com',
        adminPassword: hashedPassword,
        active: true,
        plan: 'enterprise',
        contactPhone: '9876543210',
        address: 'MRF Headquarters',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
        country: 'India',
        allowedDomains: ['mrf.com']
      });
      console.log(`Created MRF tenant with ID: ${mrfTenant._id}`);
    } else {
      console.log(`Found MRF tenant with ID: ${mrfTenant._id}`);
    }
    
    // Find supplier role
    const supplierRole = await Role.findOne({ code: 'supplier' });
    if (!supplierRole) {
      console.error('Supplier role not found. Run the permission and role seed script first.');
      process.exit(1);
    }
    
    // Find or create supplier10 user
    let supplier10User = await User.findOne({ 
      email: 'supplier10@example.com', 
      tenantId: mrfTenant._id 
    });
    
    if (!supplier10User) {
      console.log('supplier10 user not found. Creating supplier10 user...');
      
      // Hash password before saving
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      supplier10User = await User.create({
        name: 'Supplier 10',
        email: 'supplier10@example.com',
        password: hashedPassword,
        tenantId: mrfTenant._id,
        roles: ['Supplier'],
        roleIds: [supplierRole._id]
      });
      console.log(`Created supplier10 user with ID: ${supplier10User._id}`);
    } else {
      console.log(`Found supplier10 user with ID: ${supplier10User._id}`);
    }
    
    console.log(`Found supplier10 user with ID: ${supplier10User._id}`);
    
    // Find or create a vendor for supplier10
    let vendor = await Vendor.findOne({ 
      email: supplier10User.email,
      tenantId: mrfTenant._id 
    });
    
    if (!vendor) {
      console.log('Creating a vendor for supplier10...');
      vendor = await Vendor.create({
        name: 'Supplier 10 Company',
        code: 'SUP10',
        contactPerson: supplier10User.name,
        email: supplier10User.email,
        phone: '1234567890',
        address: {
          street: '123 Supplier St',
          city: 'Supplier City',
          state: 'Supplier State',
          country: 'India',
          postalCode: '600001'
        },
        website: 'https://supplier10.com',
        tenantId: mrfTenant._id
      });
      console.log(`Created vendor with ID: ${vendor._id}`);
    } else {
      console.log(`Using existing vendor with ID: ${vendor._id}`);
    }
    
    // Delete existing supplier orders for this vendor to avoid duplicates
    await SupplierOrder.deleteMany({ vendorId: vendor._id });
    
    // Create sample supplier orders
    const supplierOrders = [
      {
        orderId: 'PO-MRF-2025-0001',
        customerName: 'MRF Limited',
        orderType: 'PO',
        date: new Date('2025-04-10'),
        status: 'Requested',
        vendorId: vendor._id,
        poDetails: {
          accepted: false,
          estimatedDeliveryDate: new Date('2025-05-15'),
          poFileUrl: 'https://example.com/po/files/po-mrf-2025-0001.pdf'
        },
        deliveryStatus: {
          currentStatus: 'Not Started'
        },
        tenantId: mrfTenant._id,
        createdBy: supplier10User._id
      },
      {
        orderId: 'PO-MRF-2025-0002',
        customerName: 'MRF Limited',
        orderType: 'PO',
        date: new Date('2025-04-15'),
        status: 'Accepted',
        vendorId: vendor._id,
        poDetails: {
          accepted: true,
          estimatedDeliveryDate: new Date('2025-05-20'),
          poFileUrl: 'https://example.com/po/files/po-mrf-2025-0002.pdf'
        },
        deliveryStatus: {
          currentStatus: 'In Transit',
          trackingInfo: 'TRACK123456',
          updatedAt: new Date('2025-04-20')
        },
        tenantId: mrfTenant._id,
        createdBy: supplier10User._id
      },
      {
        orderId: 'RFQ-MRF-2025-0001',
        customerName: 'MRF Limited',
        orderType: 'Quote',
        date: new Date('2025-04-05'),
        status: 'Requested',
        vendorId: vendor._id,
        quote: {
          unitPrice: null,
          taxes: null,
          deliveryDate: null,
          terms: '',
          notes: ''
        },
        tenantId: mrfTenant._id,
        createdBy: supplier10User._id
      },
      {
        orderId: 'RFQ-MRF-2025-0002',
        customerName: 'MRF Limited',
        orderType: 'Quote',
        date: new Date('2025-04-01'),
        status: 'Accepted',
        vendorId: vendor._id,
        quote: {
          unitPrice: 5000,
          taxes: 900,
          deliveryDate: new Date('2025-05-01'),
          terms: 'Net 30',
          notes: 'Including installation and training',
          submittedAt: new Date('2025-04-03')
        },
        tenantId: mrfTenant._id,
        createdBy: supplier10User._id
      },
      {
        orderId: 'PO-MRF-2025-0003',
        customerName: 'MRF Limited',
        orderType: 'PO',
        date: new Date('2025-03-20'),
        status: 'Delivered',
        vendorId: vendor._id,
        poDetails: {
          accepted: true,
          estimatedDeliveryDate: new Date('2025-04-05'),
          poFileUrl: 'https://example.com/po/files/po-mrf-2025-0003.pdf'
        },
        deliveryStatus: {
          currentStatus: 'Delivered',
          invoiceUrl: 'https://example.com/invoices/inv-sup10-0001.pdf',
          trackingInfo: 'TRACK789012',
          updatedAt: new Date('2025-04-05')
        },
        tenantId: mrfTenant._id,
        createdBy: supplier10User._id
      }
    ];
    
    // Insert the supplier orders
    await SupplierOrder.insertMany(supplierOrders);
    
    console.log(`Successfully inserted ${supplierOrders.length} supplier orders for supplier10 in MRF tenant`);
    
  } catch (error) {
    console.error('Error seeding supplier order data:', error);
  } finally {
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedData().catch(err => {
  console.error('Fatal error:', err);
  mongoose.disconnect();
  process.exit(1);
});
