const { exec } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const CostCenter = require('../models/CostCenter');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect("mongodb://admin:admin@localhost:27017/SmartProcureDB");

/**
 * Setup the system with roles, permissions, and a CostCenterHead user
 */
async function setupSystem() {
  try {
    console.log('Starting system setup...');
    
    // Step 1: Run the seed script to ensure roles and permissions exist
    console.log('Seeding roles and permissions...');
    await runScript('seedPermissionsAndRoles.js');
    
    // Step 2: Find the tenant ID (or create one if needed)
    console.log('Finding or creating tenant...');
    const tenant = await findOrCreateTenant();
    
    // Step 3: Find or create a cost center
    console.log('Finding or creating cost center...');
    const costCenter = await findOrCreateCostCenter(tenant._id);
    
    // Step 4: Create the CostCenterHead user
    console.log('Creating CostCenterHead user...');
    await createCostCenterHeadUser(tenant._id, costCenter._id);
    
    console.log('System setup completed successfully!');
  } catch (error) {
    console.error('Error during system setup:', error);
  } finally {
    mongoose.disconnect();
  }
}

/**
 * Run a script in the utils directory
 */
function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running ${scriptName}:`, stderr);
        reject(error);
        return;
      }
      console.log(stdout);
      resolve();
    });
  });
}

/**
 * Find or create a tenant
 */
async function findOrCreateTenant() {
  // Check if a tenant already exists
  let tenant = await Tenant.findOne();
  
  // If no tenant exists, create one
  if (!tenant) {
    tenant = await Tenant.create({
      name: 'Default Tenant',
      slug: 'default',
      adminEmail: 'admin@default.com',
      adminPassword: 'admin123',
      active: true,
      plan: 'standard',
      contactPhone: '1234567890',
      address: 'Default Address',
      city: 'Default City',
      state: 'Default State',
      postalCode: '123456',
      country: 'Default Country'
    });
    console.log(`Created default tenant with ID: ${tenant._id}`);
  } else {
    console.log(`Using existing tenant: ${tenant.name} (${tenant._id})`);
  }
  
  return tenant;
}

/**
 * Find or create a cost center
 */
async function findOrCreateCostCenter(tenantId) {
  // Check if a cost center already exists
  let costCenter = await CostCenter.findOne({ tenantId });
  
  // If no cost center exists, create one
  if (!costCenter) {
    costCenter = await CostCenter.create({
      name: 'Default Cost Center',
      code: 'DEFAULT',
      description: 'Default cost center for the system',
      tenantId,
      active: true
    });
    console.log(`Created default cost center with ID: ${costCenter._id}`);
  } else {
    console.log(`Using existing cost center: ${costCenter.name} (${costCenter._id})`);
  }
  
  return costCenter;
}

/**
 * Create a CostCenterHead user
 */
async function createCostCenterHeadUser(tenantId, costCenterId) {
  // Run the createCostCenterHead script with tenant and cost center IDs
  await runScript('createCostCenterHead.js ' + tenantId + ' ' + costCenterId);
}

// Run the setup
setupSystem();
