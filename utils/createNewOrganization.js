const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Role = require('../models/Role');
const CostCenter = require('../models/CostCenter');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect("mongodb://admin:admin@localhost:27017/SmartProcureDB");

/**
 * Creates a new organization with all required entities
 * @param {String} slug - The slug for the new tenant
 */
async function createNewOrganization(slug) {
  try {
    console.log(`Creating new organization with slug: ${slug}`);
    
    // Step 1: Create the tenant
    const tenant = await createTenant(slug);
    
    // Step 2: Create admin user
    const adminUser = await createAdminUser(tenant._id);
    
    // Step 3: Create cost centers (initially without heads)
    const costCenters = await createCostCenters(tenant._id);
    
    // Step 4: Create CostCenterHead users and update cost centers
    await createCostCenterHeadUsers(tenant._id, costCenters);
    
    console.log(`\n✅ Organization "${tenant.name}" created successfully!\n`);
    console.log(`Admin login: ${adminUser.email} / Password: Admin123!`);
    console.log(`CostCenter Heads created with password: CostCenter123!`);
    
    return {
      tenant,
      costCenters
    };
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  } finally {
    mongoose.disconnect();
  }
}

/**
 * Creates a new tenant
 */
async function createTenant(slug) {
  console.log('\nCreating tenant...');
  
  // Check if tenant already exists
  const existingTenant = await Tenant.findOne({ slug });
  if (existingTenant) {
    console.log(`Tenant with slug "${slug}" already exists. Using existing tenant.`);
    return existingTenant;
  }
  
  // Format the tenant name (capitalize the slug)
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  
  // Create tenant
  const tenant = await Tenant.create({
    name,
    slug,
    adminEmail: `admin@${slug}.com`,
    adminPassword: 'Admin123!',
    active: true,
    plan: 'standard',
    contactPhone: '1234567890',
    address: `${name} Headquarters`,
    city: 'Default City',
    state: 'Default State',
    postalCode: '123456',
    country: 'Default Country'
  });
  
  console.log(`Tenant created with ID: ${tenant._id}`);
  return tenant;
}

/**
 * Creates default cost centers for the tenant
 */
async function createCostCenters(tenantId) {
  console.log('\nCreating cost centers...');
  
  const costCenterData = [
    { code: 'FINANCE', name: 'Finance Department', budget: 1000000 },
    { code: 'IT', name: 'IT Department', budget: 800000 },
    { code: 'HR', name: 'HR Department', budget: 500000 },
    { code: 'OPS', name: 'Operations', budget: 2000000 },
    { code: 'MARKETING', name: 'Marketing', budget: 1500000 }
  ];
  
  const createdCostCenters = [];
  
  for (const cc of costCenterData) {
    try {
      const costCenter = await CostCenter.create({
        ...cc,
        tenantId,
        active: true,
        // Initialize with empty approvers array
        approvers: []
      });
      
      createdCostCenters.push(costCenter);
      console.log(`Cost Center created: ${costCenter.name} (${costCenter._id})`);
    } catch (error) {
      console.error(`Error creating cost center ${cc.name}:`, error.message);
      throw error;
    }
  }
  
  return createdCostCenters;
}

/**
 * Creates an admin user for the tenant
 */
async function createAdminUser(tenantId) {
  console.log('\nCreating admin user...');
  
  // Get the administrator role from system tenant
  const systemTenant = await Tenant.findOne({ slug: 'system' });
  if (!systemTenant) {
    throw new Error('System tenant not found. Please run seedPermissionsAndRoles.js first');
  }
  
  const adminRole = await Role.findOne({ 
    code: 'administrator',
    tenantId: systemTenant._id
  });
  
  if (!adminRole) {
    throw new Error('Administrator role not found. Please run seedPermissionsAndRoles.js first');
  }
    // Create admin user
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin123!', salt);
  
  const tenant = await Tenant.findById(tenantId);
  
  const adminUser = await User.create({
    name: 'System Administrator',
    email: tenant.adminEmail,
    password: passwordHash,
    tenantId,
    roles: ['Administrator'],
    roleIds: [adminRole._id],
    authType: 'local'
  });
  
  console.log(`Admin user created: ${adminUser.email} (${adminUser._id})`);
  return adminUser;
}

/**
 * Creates CostCenterHead users for each cost center
 */
async function createCostCenterHeadUsers(tenantId, costCenters) {
  console.log('\nCreating CostCenterHead users...');
  
  // Get the CostCenterHead role from system tenant
  const systemTenant = await Tenant.findOne({ slug: 'system' });
  
  // Check if CostCenterHead role exists
  let costCenterHeadRole = await Role.findOne({ 
    code: 'costcenter_head',
    tenantId: systemTenant._id
  });
  
  // If role doesn't exist, create it
  if (!costCenterHeadRole) {
    // Get requester role
    const requesterRole = await Role.findOne({
      code: 'requester',
      tenantId: systemTenant._id
    });
    
    // Create CostCenterHead role
    costCenterHeadRole = await Role.create({
      name: 'CostCenterHead',
      code: 'costcenter_head',
      description: 'Cost Center Manager who can review and approve PRs associated with their cost center',
      inheritsFrom: requesterRole ? 'requester' : null,
      permissions: ['pr.approve', 'pr.reject', 'pr.view', 'pr.create', 'pr.edit', 'pr.submit'],
      tenantId: systemTenant._id
    });
    
    console.log(`CostCenterHead role created: ${costCenterHeadRole._id}`);
  } else {
    console.log(`Using existing CostCenterHead role: ${costCenterHeadRole._id}`);
  }
  
  // Create a CostCenterHead user for each cost center
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('CostCenter123!', salt);
  
  for (const costCenter of costCenters) {
    const ccSlug = costCenter.code.toLowerCase();
      const user = await User.create({
      name: `${costCenter.name} Head`,
      email: `${ccSlug}@example.com`,
      password: passwordHash,
      tenantId,
      costCenterId: costCenter._id,
      roles: ['CostCenterHead'],
      roleIds: [costCenterHeadRole._id],
      authType: 'local'
    });
    
    // Update the cost center with this user as the head
    costCenter.head = user._id;
    await costCenter.save();
    
    console.log(`CostCenterHead user created: ${user.email} (${user._id})`);
  }
}

// Check for command line arguments
const slug = process.argv[2];

if (!slug) {
  console.error('\nPlease provide a tenant slug as a command-line argument');
  console.log('Example: node createNewOrganization.js acme');
  mongoose.disconnect();
} else {
  createNewOrganization(slug)
    .catch(err => {
      console.error('Error in organization creation:', err);
      process.exit(1);
    });
}
