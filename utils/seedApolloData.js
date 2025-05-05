const mongoose = require('mongoose');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const CostCenter = require('../models/CostCenter');
const Department = require('../models/Department');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect("mongodb://admin:admin@localhost:27017/SmartProcureDB?authSource=admin", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Connected...');
}).catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Helper function to generate random password
const generatePassword = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Helper function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Cost centers data
const costCenterData = [
  { code: 'CC001', name: 'Finance Department', budget: 1000000 },
  { code: 'CC002', name: 'IT Department', budget: 2000000 },
  { code: 'CC003', name: 'Operations', budget: 3000000 },
  { code: 'CC004', name: 'Human Resources', budget: 500000 },
  { code: 'CC005', name: 'Marketing', budget: 1500000 }
];

// Department data (to be mapped with cost centers)
const departmentData = [
  { name: 'Financial Operations' },
  { name: 'Information Technology' },
  { name: 'Operational Management' },
  { name: 'HR Management' },
  { name: 'Marketing & Communications' }
];

// Sample names for generating users
const firstNames = ["John", "Jane", "Michael", "Emily", "David", "Sarah", "Robert", "Olivia", "William", "Sophia", 
                   "James", "Emma", "Alexander", "Ava", "Daniel", "Mia", "Matthew", "Charlotte", "Joseph", "Amelia"];

const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson",
                  "Martinez", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White"];

// Seed data
const seedApolloData = async () => {
  try {
    console.log('Starting Apollo Organization seed process...');

    // 1. Create the Apollo tenant
    let apolloTenant = await Tenant.findOne({ slug: 'apollo' });
    
    if (!apolloTenant) {
      console.log('Creating Apollo tenant...');
      apolloTenant = await Tenant.create({
        name: 'Apollo',
        slug: 'apollo',
        adminEmail: 'admin@apollo.com',
        adminPassword: 'apollo123',
        active: true,
        allowedDomains: ['apollo.com', 'apollo.org'],
      });
      console.log(`Apollo tenant created with ID: ${apolloTenant._id}`);
    } else {
      console.log(`Using existing Apollo tenant with ID: ${apolloTenant._id}`);
    }

    // 2. Get system tenant and copy roles/permissions from there
    const systemTenant = await Tenant.findOne({ slug: 'system' });
    if (!systemTenant) {
      console.error('System tenant not found! Please run seedPermissionsAndRoles.js first.');
      process.exit(1);
    }

    // Get all permissions
    const allPermissions = await Permission.find();
    if (allPermissions.length === 0) {
      console.error('No permissions found! Please run seedPermissionsAndRoles.js first.');
      process.exit(1);
    }
    console.log(`Found ${allPermissions.length} permissions`);

    // Get all system roles
    const systemRoles = await Role.find({ tenantId: systemTenant._id });
    if (systemRoles.length === 0) {
      console.error('No system roles found! Please run seedPermissionsAndRoles.js first.');
      process.exit(1);
    }    console.log(`Found ${systemRoles.length} system roles`);

    // 3. Create Apollo roles based on system roles
    // First, delete any existing Apollo roles to avoid conflicts
    console.log('Removing any existing Apollo roles...');
    await Role.deleteMany({ tenantId: apolloTenant._id });
    
    console.log('Creating Apollo roles...');
    const roleMap = {};
    for (const sysRole of systemRoles) {
      const existingRole = await Role.findOne({ 
        code: sysRole.code,
        tenantId: apolloTenant._id 
      });

      if (!existingRole) {
        const newRole = await Role.create({
          name: sysRole.name,
          code: sysRole.code,
          description: sysRole.description,
          permissions: sysRole.permissions,
          inheritsFrom: sysRole.inheritsFrom,
          tenantId: apolloTenant._id
        });
        roleMap[sysRole.code] = newRole._id;
        console.log(`Created role: ${newRole.name}`);
      } else {
        roleMap[sysRole.code] = existingRole._id;
        console.log(`Using existing role: ${existingRole.name}`);
      }
    }

    // 4. Create cost centers
    console.log('Creating cost centers...');
    const costCenters = [];
    for (const cc of costCenterData) {
      const existingCC = await CostCenter.findOne({
        code: cc.code,
        tenantId: apolloTenant._id
      });

      if (!existingCC) {
        const newCC = await CostCenter.create({
          ...cc,
          tenantId: apolloTenant._id
        });
        costCenters.push(newCC);
        console.log(`Created cost center: ${newCC.name}`);
      } else {
        costCenters.push(existingCC);
        console.log(`Using existing cost center: ${existingCC.name}`);
      }
    }

    // 5. Create departments linked to cost centers
    console.log('Creating departments...');
    const departments = [];
    for (let i = 0; i < departmentData.length; i++) {
      const existingDept = await Department.findOne({
        name: departmentData[i].name,
        tenantId: apolloTenant._id
      });

      if (!existingDept) {
        const newDept = await Department.create({
          name: departmentData[i].name,
          tenantId: apolloTenant._id,
          costCenterId: costCenters[i]._id
        });
        departments.push(newDept);
        console.log(`Created department: ${newDept.name}`);
      } else {
        departments.push(existingDept);
        console.log(`Using existing department: ${existingDept.name}`);
      }
    }

    // 6. Create users with different roles
    console.log('Creating users...');
    
    // Delete existing users for Apollo tenant to avoid duplicates
    await User.deleteMany({ tenantId: apolloTenant._id });
    
    const users = [];
    let userCount = 0;
    
    // Create 4 admin users
    for (let i = 0; i < 4; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `admin${i+1}@apollo.com`;
      const password = await hashPassword('Password123!');
      
      const adminUser = await User.create({
        name: `${firstName} ${lastName}`,
        email,
        password,
        tenantId: apolloTenant._id,
        roles: ['Administrator'],
        roleIds: [roleMap.administrator],
        active: true
      });
      
      users.push(adminUser);
      userCount++;
      console.log(`Created admin user: ${adminUser.name}`);
    }
    
    // Create 10 procurement managers
    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `procmgr${i+1}@apollo.com`;
      const password = await hashPassword('Password123!');
      const deptIndex = i % departments.length;
      
      const procUser = await User.create({
        name: `${firstName} ${lastName}`,
        email,
        password,
        tenantId: apolloTenant._id,
        roles: ['ProcurementTeam'],
        roleIds: [roleMap.procurement_manager],
        departmentId: departments[deptIndex]._id,
        costCenterId: costCenters[deptIndex]._id,
        active: true
      });
      
      users.push(procUser);
      userCount++;
      console.log(`Created procurement manager: ${procUser.name}`);
    }
    
    // Create 5 cost center heads (and map them to cost centers)
    for (let i = 0; i < 5; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `cchead${i+1}@apollo.com`;
      const password = await hashPassword('Password123!');
      
      const ccHeadUser = await User.create({
        name: `${firstName} ${lastName}`,
        email,
        password,
        tenantId: apolloTenant._id,
        roles: ['CostCenterHead'],
        roleIds: [roleMap.approver],
        departmentId: departments[i]._id,
        costCenterId: costCenters[i]._id,
        active: true,
        approvalLimits: {
          requisition: 100000,
          purchase: 50000
        },
        approvalHierarchy: 2
      });
      
      users.push(ccHeadUser);
      userCount++;
      console.log(`Created cost center head: ${ccHeadUser.name}`);
      
      // Update the cost center with the approver
      await CostCenter.findByIdAndUpdate(costCenters[i]._id, {
        $push: {
          approvers: {
            userId: ccHeadUser._id,
            level: 1
          }
        }
      });
    }
    
    // Create 2 finance users
    for (let i = 0; i < 2; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `finance${i+1}@apollo.com`;
      const password = await hashPassword('Password123!');
      
      const financeUser = await User.create({
        name: `${firstName} ${lastName}`,
        email,
        password,
        tenantId: apolloTenant._id,
        roles: ['Finance'],
        roleIds: [roleMap.finance_analyst],
        departmentId: departments[0]._id, // Finance department
        costCenterId: costCenters[0]._id, // Finance cost center
        active: true
      });
      
      users.push(financeUser);
      userCount++;
      console.log(`Created finance user: ${financeUser.name}`);
    }
    
    // Create remaining users as employees
    const remainingCount = 50 - userCount;
    for (let i = 0; i < remainingCount; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `employee${i+1}@apollo.com`;
      const password = await hashPassword('Password123!');
      const deptIndex = i % departments.length;
      
      const empUser = await User.create({
        name: `${firstName} ${lastName}`,
        email,
        password,
        tenantId: apolloTenant._id,
        roles: ['Employee'],
        roleIds: [roleMap.requester],
        departmentId: departments[deptIndex]._id,
        costCenterId: costCenters[deptIndex]._id,
        active: true
      });
      
      users.push(empUser);
      console.log(`Created employee: ${empUser.name}`);
    }
    
    // Update department managers
    for (let i = 0; i < departments.length; i++) {
      // Find a user from this department to make manager
      const deptUsers = users.filter(u => 
        u.departmentId && u.departmentId.toString() === departments[i]._id.toString() && 
        u.roles.includes('CostCenterHead'));
        
      if (deptUsers.length > 0) {
        const manager = deptUsers[0];
        await Department.findByIdAndUpdate(departments[i]._id, {
          manager: manager._id
        });
        console.log(`Set ${manager.name} as manager for ${departments[i].name}`);
      }
    }

    console.log('Apollo seed data created successfully');
  } catch (error) {
    console.error('Error seeding Apollo data:', error);
  } finally {
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedApolloData();
