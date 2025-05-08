const mongoose = require('mongoose');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const Tenant = require('../models/Tenant');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect("mongodb://admin:admin@localhost:27017/SmartProcureDB");

const permissionsList = [  

  // PR Management Permissions
  { code: 'pr.create', name: 'Create PR', description: 'Create purchase requisitions', category: 'PR Management' },
  { code: 'pr.view', name: 'View PR', description: 'View purchase requisitions', category: 'PR Management' },
  { code: 'pr.edit', name: 'Edit PR', description: 'Edit purchase requisitions', category: 'PR Management' },
  { code: 'pr.submit', name: 'Submit PR', description: 'Submit purchase requisitions for approval', category: 'PR Management' },
  { code: 'pr.approve', name: 'Approve PR', description: 'Approve purchase requisitions', category: 'PR Management' },
  { code: 'pr.reject', name: 'Reject PR', description: 'Reject purchase requisitions', category: 'PR Management' },
  { code: 'pr.cancel', name: 'Cancel PR', description: 'Cancel purchase requisitions', category: 'PR Management' },

  // PO Management Permissions
  { code: 'po.create', name: 'Create PO', description: 'Create purchase orders', category: 'PO Management' },
  { code: 'po.view', name: 'View PO', description: 'View purchase orders', category: 'PO Management' },
  { code: 'po.edit', name: 'Edit PO', description: 'Edit purchase orders', category: 'PO Management' },
  { code: 'po.approve', name: 'Approve PO', description: 'Approve purchase orders', category: 'PO Management' },
  { code: 'po.send_to_supplier', name: 'Send PO to Supplier', description: 'Send purchase orders to suppliers', category: 'PO Management' },
  { code: 'po.cancel', name: 'Cancel PO', description: 'Cancel purchase orders', category: 'PO Management' },
  // Simplified RFQ Permissions
  { code: 'rfq.create', name: 'Create RFQ', description: 'Create new Request for Quotations', category: 'RFQ Management' },
  { code: 'rfq.view', name: 'View RFQ', description: 'View Request for Quotations', category: 'RFQ Management' },
  { code: 'rfq.edit', name: 'Edit RFQ', description: 'Edit Request for Quotations', category: 'RFQ Management' },
  { code: 'rfq.submit', name: 'Submit RFQ', description: 'Submit RFQs to vendors', category: 'RFQ Management' },
  { code: 'rfq.award', name: 'Award RFQ', description: 'Award RFQs to selected vendors', category: 'RFQ Management' },
  { code: 'rfq.cancel', name: 'Cancel RFQ', description: 'Cancel Request for Quotations', category: 'RFQ Management' },

  // Budget Management Permissions
  { code: 'budget.view', name: 'View Budget', description: 'View budget information', category: 'Budget Management' },
  { code: 'budget.check', name: 'Check Budget', description: 'Perform budget checks', category: 'Budget Management' },
  { code: 'budget.override', name: 'Override Budget', description: 'Override budget limits', category: 'Budget Management' },

  // Supplier Management Permissions
  { code: 'supplier.create', name: 'Create Supplier', description: 'Create new suppliers', category: 'Supplier Management' },
  { code: 'supplier.view', name: 'View Supplier', description: 'View supplier information', category: 'Supplier Management' },
  { code: 'supplier.edit', name: 'Edit Supplier', description: 'Edit supplier information', category: 'Supplier Management' },
  { code: 'supplier.portal_access', name: 'Supplier Portal Access', description: 'Access supplier portal and view assigned POs', category: 'Supplier Management' },
  { code: 'supplier.respond_po', name: 'Respond to PO', description: 'Ability to accept or reject purchase orders', category: 'Supplier Management' },
  { code: 'supplier.update_profile', name: 'Update Supplier Profile', description: 'Update own supplier profile information', category: 'Supplier Management' },
  // Finance Operations Permissions
  { code: 'invoice.match', name: 'Match Invoice', description: 'Match invoices with purchase orders', category: 'Finance Operations' },
  { code: 'payment.release', name: 'Release Payment', description: 'Release payments to suppliers', category: 'Finance Operations' },
  { code: 'payment.view_schedule', name: 'View Payment Schedule', description: 'View payment schedules', category: 'Finance Operations' },

  // User Management Permissions
  { code: 'user.manage', name: 'Manage Users', description: 'Manage users in the system', category: 'System Administration' },
  { code: 'role.manage', name: 'Manage Roles', description: 'Manage roles and permissions', category: 'System Administration' },
  // additional system administration permissions
  { code: 'audit.view', name: 'View Audit Logs', description: 'View system audit logs', category: 'System Administration' },
  { code: 'settings.manage', name: 'Manage Settings', description: 'Manage system settings', category: 'System Administration' }
];

const roleDefinitions = [  {
    name: 'Requester',
    code: 'requester',
    description: 'Can create and submit PRs, and view own PRs',
    permissions: ['pr.create', 'pr.view', 'pr.edit', 'pr.submit', 'rfq.view']
  },
  {
    name: 'CostCenterHead',
    code: 'costcenter_head',
    description: 'Cost Center Manager who can review and approve PRs associated with their cost center',
    inheritsFrom: 'requester',
    permissions: ['pr.approve', 'pr.reject', 'pr.view', 'rfq.view']
  },
  {
    name: 'Approver',
    code: 'approver',
    description: 'Can review and approve PRs and POs',
    inheritsFrom: 'requester',
    permissions: ['pr.approve', 'pr.reject', 'po.view', 'po.approve', 'rfq.view']
  },
  {
    name: 'Procurement Manager',
    code: 'procurement_manager',
    description: 'Can manage suppliers, generate POs, and oversee procurement',
    inheritsFrom: 'approver',
    permissions: [
      'po.create', 'po.edit', 'po.send_to_supplier', 
      'supplier.create', 'supplier.view', 'supplier.edit',
      // RFQ permissions for Procurement Manager
      'rfq.create', 'rfq.view', 'rfq.edit', 'rfq.submit', 'rfq.award', 'rfq.cancel'
    ]
  },  {
    name: 'Finance Analyst',
    code: 'finance_analyst',
    description: 'Can perform budget checks, approve payments, and manage financial records',
    permissions: [
      'pr.view', 'po.view', 'budget.view', 'budget.check', 
      'invoice.match', 'payment.view_schedule',
      // Limited RFQ permissions for Finance
      'rfq.view'
    ]
  },  {
    name: 'Administrator',
    code: 'administrator',
    description: 'Full access to all system functions',
    permissions: [
      // PR Management
      'pr.create', 'pr.view', 'pr.edit', 'pr.submit', 'pr.approve', 'pr.reject', 'pr.cancel',
      // PO Management
      'po.create', 'po.view', 'po.edit', 'po.approve', 'po.send_to_supplier', 'po.cancel',
      // Budget Management
      'budget.view', 'budget.check', 'budget.override',
      // Supplier Management
      'supplier.create', 'supplier.view', 'supplier.edit', 'supplier.portal_access', 
      'supplier.respond_po', 'supplier.update_profile',
      // Finance Operations
      'invoice.match', 'payment.release', 'payment.view_schedule',
      // System Administration
      'user.manage', 'role.manage', 'audit.view', 'settings.manage',
      // RFQ Management
      'rfq.create', 'rfq.view', 'rfq.edit', 'rfq.submit', 'rfq.award', 'rfq.cancel'
    ]
  },
  {
    name: 'Supplier',
    code: 'supplier',
    description: 'External supplier with access to supplier portal',
    permissions: [
      'supplier.portal_access',
      'supplier.respond_po',
      'supplier.update_profile',
      'po.view'
    ]
  },  {
    name: 'Procurement Officer',
    code: 'procurement_officer',
    description: 'Assists in procurement processes and manages RFQs',
    permissions: [
      'pr.view', 'po.view', 'supplier.view',
      // RFQ permissions for Procurement Officer
      'rfq.create', 'rfq.view', 'rfq.edit', 'rfq.submit'
    ]
  },  {
    name: 'Buyer',
    code: 'buyer',
    description: 'Can manage RFQs and vendor quotes',
    permissions: [
      'pr.view', 'po.view', 'supplier.view',
      // RFQ specific permissions for buyer
      'rfq.create', 'rfq.view', 'rfq.edit', 'rfq.submit', 'rfq.award'
    ]
  }
];

const seedData = async () => {
  try {
    // Find or create the system tenant
    let systemTenant = await Tenant.findOne({ slug: 'system' });
    
    if (!systemTenant) {
      console.log('Creating system tenant...');
      systemTenant = await Tenant.create({
        name: 'System',
        slug: 'system',
        adminEmail: 'admin@system.com',
        adminPassword: 'admin123',
        active: true,
        plan: 'enterprise',
        contactPhone: '0000000000',
        address: 'System Address',
        city: 'System City',
        state: 'System State',
        postalCode: '000000',
        country: 'System Country',
        isSystemTenant: true
      });
      console.log(`System tenant created with ID: ${systemTenant._id}`);
    } else {
      console.log(`Using existing system tenant with ID: ${systemTenant._id}`);
    }

    // Clear existing permissions and roles
    await Permission.deleteMany({});
    await Role.deleteMany({});

    // Insert permissions
    const permissions = await Permission.insertMany(permissionsList);
    console.log(`${permissions.length} permissions inserted`);

    // Insert roles with the system tenant ID
    for (const roleDef of roleDefinitions) {
      await Role.create({
        ...roleDef,
        tenantId: systemTenant._id
      });
    }

    console.log(`${roleDefinitions.length} roles inserted`);
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedData();
