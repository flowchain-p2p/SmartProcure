/**
 * Script to add a sample location to each tenant that doesn't have one
 * Usage: node utils/add-sample-locations.js
 */

const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Location = require('../models/Location');
const colors = require('colors');

// Connect to database
mongoose.connect("mongodb://admin:admin@localhost:27017/SmartProcureDB?authSource=admin");

const addSampleLocations = async () => {
  try {
    console.log('Starting to add sample locations to tenants without locations...'.yellow);

    // Get all tenants
    const tenants = await Tenant.find({});
    console.log(`Found ${tenants.length} tenants in the system`.cyan);

    for (const tenant of tenants) {
      // Check if tenant has any locations
      const locationCount = await Location.countDocuments({ tenantId: tenant._id });
      
      if (locationCount === 0) {
        console.log(`Creating sample location for tenant: ${tenant.name}`.cyan);
          // Create a sample location for this tenant
        const sampleLocation = new Location({
          code: 'CHENNAI-HEAD-OFFICE',
          name: 'Chennai Head Office',
          address: '124, Greams Rd, Thousand Lights West, Thousand Lights',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          postalCode: '600006',
          tenantId: tenant._id,
          isActive: true
        });
        
        await sampleLocation.save();
        
        // Update the tenant's default location
        tenant.defaultLocationId = sampleLocation._id;
        await tenant.save();
        
        console.log(`Created sample location "${sampleLocation.code}" for tenant ${tenant.name}`.green);
      } else {
        console.log(`Tenant ${tenant.name} already has ${locationCount} locations`.cyan);
      }
    }

    console.log('Sample location creation completed successfully!'.green);
  } catch (error) {
    console.error('Error creating sample locations:'.red, error);
  } finally {
    // Close database connection
    mongoose.connection.close();
  }
};

// Run the script
addSampleLocations();
