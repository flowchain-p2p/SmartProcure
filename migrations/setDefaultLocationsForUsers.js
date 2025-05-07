/**
 * Migration script to set default locations for all users who don't have one
 * Usage: node migrations/setDefaultLocationsForUsers.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Location = require('../models/Location');
const colors = require('colors');

// Connect to database
mongoose.connect("mongodb://admin:admin@localhost:27017/SmartProcureDB");

const setDefaultLocationsForUsers = async () => {
  try {
    console.log('Starting migration to set default locations for users...'.yellow);

    // Get all tenants
    const allTenants = await Tenant.find({});
    
    // Check which tenants don't have default locations
    const tenantsWithoutDefaultLocation = allTenants.filter(
      tenant => !tenant.defaultLocationId
    );
    
    if (tenantsWithoutDefaultLocation.length > 0) {
      console.log(`Warning: ${tenantsWithoutDefaultLocation.length} tenants don't have a default location set`.yellow);
      for (const tenant of tenantsWithoutDefaultLocation) {
        // Find the first location for this tenant
        const firstLocation = await Location.findOne({ tenantId: tenant._id });
        if (firstLocation) {
          console.log(`Setting first location as default for tenant ${tenant.name}`.yellow);
          tenant.defaultLocationId = firstLocation._id;
          await tenant.save();
        } else {
          console.log(`No locations found for tenant ${tenant.name}. Skipping...`.yellow);
        }
      }
    }

    // Get all tenants with default locations
    const tenants = await Tenant.find({ defaultLocationId: { $exists: true, $ne: null } });
    
    console.log(`Found ${tenants.length} tenants with default locations`.cyan);

    let totalUpdated = 0;    // For each tenant, update its users
    for (const tenant of tenants) {
      // Find users without default locations or with empty preferred locations for this tenant
      const users = await User.find({ 
        tenantId: tenant._id, 
        $or: [
          { defaultLocationId: { $exists: false } },
          { defaultLocationId: null },
          { preferredLocations: { $size: 0 } }
        ]
      });
      
      console.log(`Found ${users.length} users without default location for tenant ${tenant.name}`.cyan);

      // Update each user
      for (const user of users) {
        user.defaultLocationId = tenant.defaultLocationId;
        
        // Also add to preferred locations if not already there
        if (!user.preferredLocations) {
          user.preferredLocations = [tenant.defaultLocationId];
        } else if (!user.preferredLocations.includes(tenant.defaultLocationId)) {
          user.preferredLocations.push(tenant.defaultLocationId);
        }        await user.save();
        totalUpdated++;
      }

      console.log(`Updated ${users.length} users for tenant ${tenant.name}`.green);
    }

    console.log(`Migration completed successfully! Updated ${totalUpdated} users.`.green);
    
  } catch (error) {
    console.error('Migration failed with error:'.red, error);
  } finally {
    // Close database connection
    mongoose.connection.close();
  }
};

// Run the migration
setDefaultLocationsForUsers();
