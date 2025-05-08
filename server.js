const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDatabase = require('./config/database');
const { swaggerSpec, swaggerUi } = require('./config/swagger');

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
const auth = require('./routes/auth');
const users = require('./routes/users');
const departments = require('./routes/departments');
const costCenters = require('./routes/costCenters');
const tenants = require('./routes/tenants');
const domainAuthRoutes = require('./routes/domainAuth');
const domainRoutes = require('./routes/domain');
const productRoutes = require('./routes/product');
const categoryRoutes = require('./routes/category');
const uomRoutes = require('./routes/uom');
const requisitionRoutes = require('./routes/requisition');
const catalogRoutes = require('./routes/catalog');
const locationRoutes = require('./routes/locations');
const vendorRoutes = require('./routes/vendors');
const supplierInviteRoutes = require('./routes/supplierInvite');
const purchaseOrderRoutes = require('./routes/purchaseOrder');
const rfqRoutes = require('./routes/rfq');

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/tenants/:tenantSlug/users', users);
app.use('/api/v1/tenants/:tenantSlug/departments', departments);
app.use('/api/v1/tenants/:tenantSlug/cost-centers', costCenters);
app.use('/api/v1/tenants', tenants);
app.use('/api/v1/auth', domainAuthRoutes);
app.use('/api/v1/domain', domainRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/uom', uomRoutes);
app.use('/api/v1/requisitions', requisitionRoutes);
app.use('/api/v1/catalogs', catalogRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/suppliers', supplierInviteRoutes);
app.use('/api/v1/purchase-orders', purchaseOrderRoutes);
app.use('/api/v1/rfqs', rfqRoutes);

// Set up Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { 
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Instatenders API Documentation"
}));

// JSON endpoint for Swagger spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Default route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Multi-Tenant Procurement API is running',
    documentation: '/api-docs'
  });
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