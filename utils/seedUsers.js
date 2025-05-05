const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Seeds 5 users for the specified tenant, each with a different role
 * Tenant ID: "681884bd5226f28ef7e8a4fd" (MRF)
 * Default password for all users: Password@123
 */
const seedUsers = async () => {
  try {
    console.log('Seeding users for MRF tenant...');
    
    // Hash the password upfront to avoid hashing multiple times
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password@123', salt);
    
    // Define users with different roles
    const users = [
      {
        name: 'John Employee',
        email: 'employee@mrf.com',
        password: hashedPassword,
        tenantId: '681884bd5226f28ef7e8a4fd',
        authType: 'local',
        position: 'Staff',
        approvalLimits: {
          requisition: 0,
          purchase: 0
        },
        approvalHierarchy: 1,
        active: true,
        roles: ['Employee']
      },
      {
        name: 'Sarah Manager',
        email: 'manager@mrf.com',
        password: hashedPassword,
        tenantId: '681884bd5226f28ef7e8a4fd',
        authType: 'local',
        position: 'Department Manager',
        approvalLimits: {
          requisition: 10000,
          purchase: 5000
        },
        approvalHierarchy: 2,
        active: true,
        roles: ['Manager']
      },
      {
        name: 'David CostCenter',
        email: 'costcenter@mrf.com',
        password: hashedPassword,
        tenantId: '681884bd5226f28ef7e8a4fd',
        authType: 'local',
        position: 'Cost Center Head',
        approvalLimits: {
          requisition: 50000,
          purchase: 25000
        },
        approvalHierarchy: 3,
        active: true,
        roles: ['CostCenterHead']
      },
      {
        name: 'Patricia Procurement',
        email: 'procurement@mrf.com',
        password: hashedPassword,
        tenantId: '681884bd5226f28ef7e8a4fd',
        authType: 'local',
        position: 'Procurement Officer',
        approvalLimits: {
          requisition: 100000,
          purchase: 75000
        },
        approvalHierarchy: 3,
        active: true,
        roles: ['ProcurementTeam']
      },
      {
        name: 'Michael Finance',
        email: 'finance@mrf.com',
        password: hashedPassword,
        tenantId: '681884bd5226f28ef7e8a4fd',
        authType: 'local',
        position: 'Finance Manager',
        approvalLimits: {
          requisition: 200000,
          purchase: 150000
        },
        approvalHierarchy: 4,
        active: true,
        roles: ['Finance']
      },
      {
        name: 'Admin User',
        email: 'admin@mrf.com',
        password: hashedPassword,
        tenantId: '681884bd5226f28ef7e8a4fd',
        authType: 'local',
        position: 'System Administrator',
        approvalLimits: {
          requisition: 500000,
          purchase: 500000
        },
        approvalHierarchy: 5,
        active: true,
        roles: ['Administrator']
      }
    ];

    // Delete existing users for this tenant to avoid duplicates
    await User.deleteMany({ tenantId: '681884bd5226f28ef7e8a4fd' });
    
    // Instead of using User.create() which would trigger the pre-save hook and re-hash our already hashed passwords,
    // we'll use insertMany which bypasses middleware
    await User.insertMany(users);

    console.log('Users seeded successfully!');
    
    // Log summary of created users
    console.table(users.map(user => ({
      name: user.name,
      email: user.email,
      role: user.roles[0]
    })));
    
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

// Export the function to be used elsewhere
module.exports = seedUsers;

// If this file is run directly, execute the seed function
if (require.main === module) {
  // Connect to the database first
  const connectDB = require('../config/database');
  connectDB()
    .then(() => seedUsers())
    .then(() => {
      console.log('Seeding completed, closing connection...');
      mongoose.connection.close();
    })
    .catch(error => {
      console.error('Error in seed process:', error);
      process.exit(1);
    });
}
