/**
 * Quick script to verify user locations
 * This script will find a user and display their location information
 */
const mongoose = require('mongoose');
const User = require('./models/User');
require('./models/Location'); // Make sure Location model is registered

// Connect to database
mongoose.connect("mongodb://admin:admin@localhost:27017/SmartProcureDB?authSource=admin")
  .then(async () => {
    try {
      // Find a user with populated location info
      const user = await User.findOne().populate('defaultLocationId preferredLocations');
      
      if (!user) {
        console.log('No users found in the database.');
        return;
      }
      
      console.log('User:', user.name);
      console.log('Email:', user.email);
      console.log('Default Location:', user.defaultLocationId ? 
        `${user.defaultLocationId.name} (${user.defaultLocationId.code})` : 
        'None');
      
      console.log('Preferred Locations:', 
        user.preferredLocations.length > 0 ? 
        user.preferredLocations.map(loc => `${loc.name} (${loc.code})`).join(', ') : 
        'None');
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
