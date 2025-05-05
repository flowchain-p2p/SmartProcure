/**
 * Script to seed data for the MRF tenant
 * This script will seed 5 users with different roles for the MRF tenant
 */

// Load environment variables
require('dotenv').config();

// Connect to the database
const connectDB = require('../config/database');
const seedUsers = require('./seedUsers');

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Starting seed process...');
    await seedUsers();

    console.log('All seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seed process:', error);
    process.exit(1);
  }
};

// Run the seed function
seedData();
