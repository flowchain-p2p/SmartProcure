const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDatabase = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to database
connectDatabase();

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Import route files
const tenantRoutes = require('./routes/tenants');
const authRoutes = require('./routes/auth');
const domainAuthRoutes = require('./routes/domainAuth');
const domainRoutes = require('./routes/domain');
const catalogRoutes = require('./routes/catalog');
const categoryRoutes = require('./routes/category');

// Mount routers
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth', domainAuthRoutes);
app.use('/api/v1/domain', domainRoutes);
app.use('/api/v1/catalogs', catalogRoutes);
app.use('/api/v1/categories', categoryRoutes);

// Default route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Multi-Tenant Todo API is running' });
});

// Simple route for testing MongoDB connection
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongodb: 'connected' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});