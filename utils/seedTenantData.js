const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Role = require('../models/Role');
const CostCenter = require('../models/CostCenter');
const Department = require('../models/Department');
const Location = require('../models/Location');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables with correct path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
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
  try {    console.log('Starting MRF data seeding...');

    // Find the existing MRF Tenant (created by seedPermissionsAndRoles.js)
    console.log('Finding MRF tenant...');
    let mrfTenant = await Tenant.findOne({ name: 'MRF' });
    
    if (!mrfTenant) {
      console.error('MRF tenant not found. Please run seedPermissionsAndRoles.js first.');
      process.exit(1);
    }
    console.log(`Using existing MRF tenant with ID: ${mrfTenant._id}`);

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
    await Tenant.findByIdAndUpdate(mrfTenant._id, { defaultLocationId: createdLocations[0]._id });    // Step 3: Get existing roles
    console.log('Fetching roles...');
    
    const roles = await Role.find({ tenantId: mrfTenant._id });
    if (roles.length === 0) {
      console.error('No roles found for MRF tenant. Please run seedPermissionsAndRoles.js first.');
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
    
    // Define users - 2 users per role from the role enum
    const users = [
      // 2 Administrator users
      {
        name: 'Rajesh Sharma',
        email: 'admin1@mrf.com',
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
        name: 'Vikram Patel',
        email: 'admin2@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
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
        email: 'requester1@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
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
        email: 'requester2@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
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
      
      // 2 Approver users
      {
        name: 'Karthik Iyer',
        email: 'approver1@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[0]._id,
        position: 'Senior Manager',
        costCenterId: createdCostCenters[0]._id,
        departmentId: createdDepartments[0]._id,
        approvalLimits: {
          requisition: 100000,
          purchase: 50000
        },
        approvalHierarchy: 3,
        active: true,
        roles: ['Approver'],
        roleIds: [roleMap.approver]
      },
      {
        name: 'Priya Venkatesh',
        email: 'approver2@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[1]._id,
        position: 'Department Lead',
        costCenterId: createdCostCenters[1]._id,
        departmentId: createdDepartments[1]._id,
        approvalLimits: {
          requisition: 80000,
          purchase: 40000
        },
        approvalHierarchy: 3,
        active: true,
        roles: ['Approver'],
        roleIds: [roleMap.approver]
      },
      
      // 2 CostCenterHead users
      {
        name: 'Ravi Subramaniam',
        email: 'costcenterhead1@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
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
      // 2 Procurement Manager users
      {
        name: 'Venkat Rao',
        email: 'procurement1@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
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
        email: 'procurement2@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
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
      
      // 2 Finance Analyst users
      {
        name: 'Deepak Joshi',
        email: 'finance1@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[0]._id,
        position: 'Senior Finance Analyst',
        costCenterId: createdCostCenters[2]._id,
        departmentId: createdDepartments[2]._id,
        approvalLimits: {
          requisition: 75000,
          purchase: 40000
        },
        approvalHierarchy: 3,
        active: true,
        roles: ['Finance Analyst'],
        roleIds: [roleMap.finance_analyst]
      },
      {
        name: 'Meenakshi Sundaram',
        email: 'finance2@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
        authType: 'local',
        defaultLocationId: createdLocations[2]._id,
        position: 'Finance Analyst',
        costCenterId: createdCostCenters[2]._id,
        departmentId: createdDepartments[2]._id,
        approvalLimits: {
          requisition: 60000,
          purchase: 30000
        },
        approvalHierarchy: 2,
        active: true,
        roles: ['Finance Analyst'],
        roleIds: [roleMap.finance_analyst]
      },
      
      // 2 Supplier users
      {
        name: 'Sanjay Mehta',
        email: 'supplier1@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
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
        email: 'supplier2@mrf.com',
        password: defaultPassword,
        tenantId: mrfTenant._id,
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
    await User.deleteMany({ tenantId: mrfTenant._id });
    
    // Insert users - using insertMany to bypass the password hashing (already hashed)
    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created`);    // Step 7: Update Cost Centers with heads and Departments with managers
    console.log('Updating cost centers and departments with managers...');
    
    // Find specific users for cost center heads and approvers
    const costCenterHead1 = createdUsers.find(user => user.email === 'costcenterhead1@mrf.com');
    
    
    if (!costCenterHead1) {
      console.error('Could not find all required cost center head users!');
      process.exit(1);
    }
    
    // Update cost centers with specific heads
    // First half of cost centers get costcenterhead1@mrf.com
    for (let i = 0; i < Math.ceil(createdCostCenters.length / 2); i++) {
      await CostCenter.findByIdAndUpdate(createdCostCenters[i]._id, {
        head: costCenterHead1._id,
        $push: {
          approvers: {
            userId: costCenterHead1._id,
            level: 1
          }
        }
      });
    }
    
    // // Second half of cost centers get costcenterhead2@mrf.com
    // for (let i = Math.ceil(createdCostCenters.length / 2); i < createdCostCenters.length; i++) {
    //   await CostCenter.findByIdAndUpdate(createdCostCenters[i]._id, {
    //     head: costCenterHead2._id,
    //     $push: {
    //       approvers: {
    //         userId: costCenterHead2._id,
    //         level: 1
    //       }
    //     }
    //   });
    // }    // Update departments with managers
    // Using the same cost center head users for department managers
    for (let i = 0; i < createdDepartments.length; i++) {
      const manager = i < Math.ceil(createdDepartments.length / 2) ? costCenterHead1._id : costCenterHead1._id;
      await Department.findByIdAndUpdate(createdDepartments[i]._id, {
        manager: manager
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
