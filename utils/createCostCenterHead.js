const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const CostCenter = require('../models/CostCenter');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables with correct path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

/**
 * Creates a CostCenterHead user and associates it with a specific cost center
 * @param {Object} userData - The user data
 * @param {String} costCenterName - The name of the cost center (or cost center ID)
 * @param {String} tenantId - The tenant ID
 */
const createCostCenterHead = async (userData, costCenterName, tenantId) => {
  try {
    // Find the cost center by name or ID
    let costCenter;
    
    if (mongoose.Types.ObjectId.isValid(costCenterName)) {
      costCenter = await CostCenter.findById(costCenterName);
    } else {
      costCenter = await CostCenter.findOne({ 
        name: costCenterName, 
        tenantId 
      });
    }

    if (!costCenter) {
      console.error(`Cost Center not found: ${costCenterName}`);
      return;
    }

    // Find the CostCenterHead role for the tenant
    const costCenterHeadRole = await Role.findOne({ 
      code: 'costcenter_head', 
      tenantId 
    });

    if (!costCenterHeadRole) {
      console.error('CostCenterHead role not found. Make sure to run seedPermissionsAndRoles.js first');
      return;
    }

    // Generate a password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // Create the user
    const user = await User.create({
      name: userData.name,
      email: userData.email,
      password: passwordHash,
      tenantId,
      costCenterId: costCenter._id,
      roles: [costCenterHeadRole._id],
      authType: 'local'
    });

    // Update the costCenter with this user as the head
    costCenter.head = user._id;
    await costCenter.save();

    console.log(`Successfully created CostCenterHead user: ${userData.email}`);
    console.log(`User ID: ${user._id}`);
    console.log(`Associated with Cost Center: ${costCenter.name} (${costCenter._id})`);
    
    return user;
  } catch (error) {
    console.error('Error creating CostCenterHead user:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Example usage (you can modify the parameters as needed)
const userData = {
  name: 'Cost Center Manager',
  email: 'cchead@example.com',
  password: 'Password123!'
};

// You would need to provide a valid tenant ID and cost center name/ID
const tenantId = process.argv[2]; // Take tenant ID from command line
const costCenterName = process.argv[3]; // Take cost center name/ID from command line

if (!tenantId || !costCenterName) {
  console.error('Please provide both tenant ID and cost center name/ID as command-line arguments');
  console.log('Example: node createCostCenterHead.js 60d21b4f8e1d2c001f3a9999 "Finance Department"');
  mongoose.disconnect();
} else {
  createCostCenterHead(userData, costCenterName, tenantId);
}
