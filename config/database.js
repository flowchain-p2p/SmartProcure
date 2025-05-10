const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    //console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
    const connection = await mongoose.connect("mongodb://admin:admin@localhost:27017/SmartProcureDB");
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDatabase;