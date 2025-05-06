/**
 * Script to check if there are any users in the database
 */
const mongoose = require('mongoose');
const User = require('./models/User');
const Tenant = require('./models/Tenant');
require('./models/Location'); // Make sure Location model is registered

// Connect to database
mongoose.connect("mongodb://admin:admin@localhost:27017/SmartProcureDB?authSource=admin")
  .then(async () => {
    try {
      // Count users
      const userCount = await User.countDocuments();
      console.log(`Total users in database: ${userCount}`);
      
      if (userCount > 0) {
        // Get a sample user (without population)
        const sampleUser = await User.findOne();
        console.log('Sample user:', {
          id: sampleUser._id,
          name: sampleUser.name,
          email: sampleUser.email,
          tenantId: sampleUser.tenantId,
          defaultLocationId: sampleUser.defaultLocationId,
          preferredLocations: sampleUser.preferredLocations
        });
        
        // Check tenant
        const tenant = await Tenant.findById(sampleUser.tenantId);
        console.log('User tenant:', tenant ? tenant.name : 'Not found');
        console.log('Tenant default location:', tenant && tenant.defaultLocationId ? tenant.defaultLocationId : 'None');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
