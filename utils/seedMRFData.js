const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Role = require('../models/Role');
const CostCenter = require('../models/CostCenter');
const Department = require('../models/Department');
const Location = require('../models/Location');
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

const seedMRFData = async () => {
  try {
    console.log('Starting MRF data seeding...');

    // Step 1: Create MRF Tenant
    console.log('Creating MRF tenant...');
    let mrfTenant = await Tenant.findOne({ name: 'MRF' });
    
    if (!mrfTenant) {
      mrfTenant = await Tenant.create({
        name: 'MRF',
        slug: 'mrf',
        adminEmail: 'admin@mrf.com',
        adminPassword: 'Password@123', // Will be hashed by the pre-save hook
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
      console.log(`MRF tenant created with ID: ${mrfTenant._id}`);
    } else {
      console.log(`Using existing MRF tenant with ID: ${mrfTenant._id}`);
    }

    // Step 2: Create Locations
    console.log('Creating locations...');
    const locations = [
      { code: 'CHN', name: 'Chennai', address: 'MRF Main Office, Anna Salai', city: 'Chennai', state: 'Tamil Nadu', country: 'India', tenantId: mrfTenant._id },
      { code: 'BLR', name: 'Bangalore', address: 'MRF Office, Whitefield', city: 'Bangalore', state: 'Karnataka', country: 'India', tenantId: mrfTenant._id },
      { code: 'MUM', name: 'Mumbai', address: 'MRF Branch Office, Worli', city: 'Mumbai', state: 'Maharashtra', country: 'India', tenantId: mrfTenant._id }
    ];

    // Clear existing locations and create new ones
    await Location.deleteMany({ tenantId: mrfTenant._id });
    const createdLocations = await Location.insertMany(locations);
    console.log(`${createdLocations.length} locations created`);

    // Set default location for tenant
    await Tenant.findByIdAndUpdate(mrfTenant._id, { defaultLocationId: createdLocations[0]._id });

    // Step 3: Get existing roles or create them if needed
    console.log('Fetching roles...');
    const systemTenant = await Tenant.findOne({ slug: 'system' });
    
    if (!systemTenant) {
      console.error('System tenant not found. Please run seedPermissionsAndRoles.js first.');
      process.exit(1);
    }

    const roles = await Role.find({ tenantId: systemTenant._id });
    if (roles.length === 0) {
      console.error('No system roles found. Please run seedPermissionsAndRoles.js first.');
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
      { code: 'MFG-OPS', name: 'Manufacturing Operations', budget: 5000000, tenantId: mrfTenant._id },
      { code: 'SALES-MKT', name: 'Sales & Marketing', budget: 3000000, tenantId: mrfTenant._id },
      { code: 'CORP-ADMIN', name: 'Corporate Administration', budget: 2000000, tenantId: mrfTenant._id },
      { code: 'RND', name: 'Research & Development', budget: 4000000, tenantId: mrfTenant._id },
      { code: 'LOGISTICS', name: 'Supply Chain & Logistics', budget: 2500000, tenantId: mrfTenant._id }
    ];

    // Clear existing cost centers
    await CostCenter.deleteMany({ tenantId: mrfTenant._id });
    
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
      { name: 'Engineering Department', costCenterId: createdCostCenters[0]._id, tenantId: mrfTenant._id },
      { name: 'Marketing Department', costCenterId: createdCostCenters[1]._id, tenantId: mrfTenant._id },
      { name: 'Finance Department', costCenterId: createdCostCenters[2]._id, tenantId: mrfTenant._id },
      { name: 'Research Department', costCenterId: createdCostCenters[3]._id, tenantId: mrfTenant._id },
      { name: 'Logistics Department', costCenterId: createdCostCenters[4]._id, tenantId: mrfTenant._id }
    ];

    // Clear existing departments
    await Department.deleteMany({ tenantId: mrfTenant._id });
    
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
    
    // Define users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
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
      {
        name: 'Engineering Manager',
        email: 'engineering@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[0]._id,
        position: 'Engineering Manager',
        costCenterId: createdCostCenters[0]._id,
        departmentId: createdDepartments[0]._id,
        approvalLimits: {
          requisition: 50000,
          purchase: 25000
        },
        approvalHierarchy: 3,
        active: true,
        roles: ['Requester'],
        roleIds: [roleMap.requester]
      },
      {
        name: 'Marketing Specialist',
        email: 'marketing@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[1]._id, // Bangalore
        position: 'Marketing Specialist',
        costCenterId: createdCostCenters[1]._id,
        departmentId: createdDepartments[1]._id,
        approvalLimits: {
          requisition: 10000,
          purchase: 5000
        },
        approvalHierarchy: 2,
        active: true,
        roles: ['Requester'],
        roleIds: [roleMap.requester]
      },
      {
        name: 'R&D Scientist',
        email: 'research@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[2]._id, // Mumbai
        position: 'Senior Scientist',
        costCenterId: createdCostCenters[3]._id,
        departmentId: createdDepartments[3]._id,
        approvalLimits: {
          requisition: 20000,
          purchase: 10000
        },
        approvalHierarchy: 2,
        active: true,
        roles: ['Requester'],
        roleIds: [roleMap.requester]
      },
      {
        name: 'Logistics Coordinator',
        email: 'logistics@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[0]._id, // Chennai
        position: 'Logistics Coordinator',
        costCenterId: createdCostCenters[4]._id,
        departmentId: createdDepartments[4]._id,
        approvalLimits: {
          requisition: 15000,
          purchase: 7500
        },
        approvalHierarchy: 2,
        active: true,
        roles: ['Requester'],
        roleIds: [roleMap.requester]
      }
    ];

    // Delete existing users for this tenant to avoid duplicates
    await User.deleteMany({ tenantId: mrfTenant._id });
    
    // Insert users - using insertMany to bypass the password hashing (already hashed)
    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created`);

    // Step 7: Update Cost Centers with heads and Departments with managers
    console.log('Updating cost centers and departments with managers...');
    
    // Update cost centers with heads
    for (let i = 0; i < createdCostCenters.length; i++) {
      const userIndex = i % createdUsers.length;
      await CostCenter.findByIdAndUpdate(createdCostCenters[i]._id, {
        head: createdUsers[userIndex]._id,
        $push: {
          approvers: {
            userId: createdUsers[userIndex]._id,
            level: 1
          }
        }
      });
    }

    // Update departments with managers
    for (let i = 0; i < createdDepartments.length; i++) {
      const userIndex = i % createdUsers.length;
      await Department.findByIdAndUpdate(createdDepartments[i]._id, {
        manager: createdUsers[userIndex]._id
      });
    }

    console.log('Seed completed successfully!');
    
    // Log summary of created entities
    console.log('=== MRF Seed Data Summary ===');
    console.log(`Tenant: ${mrfTenant.name} (${mrfTenant._id})`);
    console.log(`Admin: ${users[0].name} (${users[0].email})`);
    console.log(`Users: ${users.length} created`);
    console.log(`Cost Centers: ${createdCostCenters.length} created`);
    console.log(`Departments: ${createdDepartments.length} created`);
    console.log(`Locations: ${createdLocations.length} created`);
    console.log('============================');
    console.log('Common Password for all users: Password@123');
    
  } catch (error) {
    console.error('Error seeding MRF data:', error);
  } finally {
    // Close database connection
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedMRFData();
