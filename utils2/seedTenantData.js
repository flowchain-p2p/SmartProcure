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

// Helper function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const seedTenantData = async () => {
  try {
    console.log(`Starting ${tenantName} data seeding...`);

    // Step 1: Create Tenant
    console.log(`Creating ${tenantName} tenant...`);
    let tenant = await Tenant.findOne({ name: tenantName });
    
    if (!tenant) {
      tenant = await Tenant.create({
        name: tenantName,
        slug: tenantSlug,
        adminEmail: `admin@${tenantSlug}.com`,
        adminPassword: 'Password@123', // Will be hashed by the pre-save hook
        active: true,
        plan: 'enterprise',
        contactPhone: '9876543210',
        address: `${tenantName} Headquarters`,
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
        country: 'India',
        allowedDomains: [`${tenantSlug}.com`]
      });
      console.log(`${tenantName} tenant created with ID: ${tenant._id}`);
    } else {
      console.log(`Using existing ${tenantName} tenant with ID: ${tenant._id}`);
    }

    // Step 2: Create Locations
    console.log('Creating locations...');
    const locationData = [
      { code: 'CHN', name: 'Chennai', address: `${tenantName} Main Office, Anna Salai`, city: 'Chennai', state: 'Tamil Nadu', country: 'India', tenantId: tenant._id },
      { code: 'BLR', name: 'Bangalore', address: `${tenantName} Office, Whitefield`, city: 'Bangalore', state: 'Karnataka', country: 'India', tenantId: tenant._id },
      { code: 'MUM', name: 'Mumbai', address: `${tenantName} Branch Office, Worli`, city: 'Mumbai', state: 'Maharashtra', country: 'India', tenantId: tenant._id }
    ];

    // Delete existing locations for this tenant
    await Location.deleteMany({ tenantId: tenant._id });
    const createdLocations = await Location.insertMany(locationData);
    console.log(`${createdLocations.length} locations created`);

    // Set default location for tenant
    await Tenant.findByIdAndUpdate(tenant._id, { defaultLocationId: createdLocations[0]._id });

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
    
    // Define users - 2 users per role from the role enum
    const users = [
      // 2 Administrator users
      {
        name: 'Rajesh Sharma',
        email: `admin1@${tenantSlug}.com`,
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
      {
        name: 'Vikram Patel',
        email: `admin2@${tenantSlug}.com`,
        password: defaultPassword,
        tenantId: tenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[0]._id,
        position: 'Assistant System Administrator',
        costCenterId: createdCostCenters[2]._id, // Corporate Administration
        departmentId: createdDepartments[2]._id, // Finance Department
        approvalLimits: {
          requisition: 900000,
          purchase: 450000
        },
        approvalHierarchy: 5,
        active: true,
        roles: ['Administrator'],
        roleIds: [roleMap.administrator]
      },
      
      // 2 Requester users
      {
        name: 'Aditya Nair',
        email: `requester1@${tenantSlug}.com`,
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
      {
        name: 'Sunita Reddy',
        email: `requester2@${tenantSlug}.com`,
        password: defaultPassword,
        tenantId: tenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[1]._id, // Bangalore
        position: 'Research Associate',
        costCenterId: createdCostCenters[3]._id,
        departmentId: createdDepartments[3]._id,
        approvalLimits: {
          requisition: 20000,
          purchase: 8000
        },
        approvalHierarchy: 1,
        active: true,
        roles: ['Requester'],
        roleIds: [roleMap.requester]
      },
           
      
      // 3 CostCenterHead users
      {
        name: 'Ravi Subramaniam',
        email: `costcenterhead1@${tenantSlug}.com`,
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
      {
        name: 'Ananya Krishnan',
        email: `costcenterhead2@${tenantSlug}.com`,
        password: defaultPassword,
        tenantId: tenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[2]._id,
        position: 'Cost Center Manager',
        costCenterId: createdCostCenters[1]._id,
        departmentId: createdDepartments[1]._id,
        approvalLimits: {
          requisition: 120000,
          purchase: 70000
        },
        approvalHierarchy: 4,
        active: true,
        roles: ['CostCenterHead'],
        roleIds: [roleMap.costcenter_head]
      },
      
      // 4 Procurement Manager users
      {
        name: 'Venkat Rao',
        email: `procurement1@${tenantSlug}.com`,
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
      },
      {
        name: 'Lakshmi Menon',
        email: `procurement2@${tenantSlug}.com`,
        password: defaultPassword,
        tenantId: tenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[1]._id,
        position: 'Procurement Manager',
        costCenterId: createdCostCenters[4]._id,
        departmentId: createdDepartments[4]._id,
        approvalLimits: {
          requisition: 180000,
          purchase: 90000
        },
        approvalHierarchy: 3,
        active: true,
        roles: ['Procurement Manager'],
        roleIds: [roleMap.procurement_manager]
      },
      
      
      // 5 Supplier users
      {
        name: 'Sanjay Mehta',
        email: `supplier1@${tenantSlug}.com`,
        password: defaultPassword,
        tenantId: tenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[0]._id,
        position: 'Vendor Representative',
        costCenterId: createdCostCenters[4]._id,
        departmentId: createdDepartments[4]._id,
        approvalLimits: {
          requisition: 0,
          purchase: 0
        },
        approvalHierarchy: 0,
        active: true,
        roles: ['Supplier'],
        roleIds: [roleMap.supplier]
      },
      {
        name: 'Arjun Malhotra',
        email: `supplier2@${tenantSlug}.com`,
        password: defaultPassword,
        tenantId: tenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[1]._id,
        position: 'Vendor Manager',
        costCenterId: createdCostCenters[4]._id,
        departmentId: createdDepartments[4]._id,
        approvalLimits: {
          requisition: 0,
          purchase: 0
        },
        approvalHierarchy: 0,
        active: true,
        roles: ['Supplier'],
        roleIds: [roleMap.supplier]
      }
    ];

    // Delete existing users for this tenant to avoid duplicates
    await User.deleteMany({ tenantId: tenant._id });
    
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
    console.log(`=== ${tenantName} Seed Data Summary ===`);
    console.log(`Tenant: ${tenant.name} (${tenant._id})`);
    console.log(`Admin: ${users[0].name} (${users[0].email})`);
    console.log(`Users: ${users.length} created`);
    console.log(`Cost Centers: ${createdCostCenters.length} created`);
    console.log(`Departments: ${createdDepartments.length} created`);
    console.log(`Locations: ${createdLocations.length} created`);
    console.log('============================');
    console.log('Common Password for all users: Password@123');
    
  } catch (error) {
    console.error(`Error seeding ${tenantName} data:`, error);
  } finally {
    // Close database connection
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedTenantData();
