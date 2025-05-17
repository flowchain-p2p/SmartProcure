const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    // Print partial MongoDB URI for debugging (hide credentials)
    const dbUriForLogging = process.env.MONGODB_URI 
      ? process.env.MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb$1://USERNAME:PASSWORD@')
      : 'MONGODB_URI environment variable is not defined';
    
    console.log(`Attempting to connect to MongoDB: ${dbUriForLogging}`);
    
    // Add connection options for better reliability
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increase timeout for server selection
      socketTimeoutMS: 45000, // Increase socket timeout
      connectTimeoutMS: 30000, // Connection timeout
      heartbeatFrequencyMS: 10000 // Heartbeat to check connection status
    });
    
    console.log(`MongoDB connected: ${connection.connection.host}`);
    console.log(`MongoDB database name: ${connection.connection.name}`);
    console.log(`MongoDB connection state: ${connection.connection.readyState}`);
    
    // Log when the connection gets disconnected
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    // Log when the connection reconnects
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    return connection;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error(`MongoDB error name: ${error.name}`);
    console.error(`MongoDB error code: ${error.code || 'No code'}`);
    console.error(`MongoDB error stack: ${error.stack}`);
    
    // Don't exit immediately in production to allow for recovery
    if (process.env.NODE_ENV === 'production') {
      console.error('Database connection failed. Application will continue to run and retry connection.');
      // Set up a retry mechanism
      setTimeout(() => {
        console.log('Attempting to reconnect to MongoDB...');
        connectDatabase();
      }, 10000); // Retry after 10 seconds
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDatabase;