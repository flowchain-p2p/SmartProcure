# GitHub Copilot Instructions for Multi-Tenant Backend

This file provides guidance for GitHub Copilot when generating code for this multi-tenant backend application. The instructions here will help ensure that generated code follows the project's architecture, patterns, and best practices.

## Project Overview

This is a multi-tenant API backend built with:
- Node.js and Express.js
- MongoDB with Mongoose
- JWT for authentication
- Multi-tenant architecture with domain-based isolation

## Code Style and Standards

- Use ES6+ JavaScript features but avoid TypeScript syntax
- Use async/await for asynchronous operations rather than callbacks or raw promises
- Follow RESTful API design principles
- Implement proper error handling with try/catch blocks
- Use descriptive variable and function names
- Add JSDoc comments for functions and complex logic

## API Structure

- Routes should be defined in the `/routes` directory
- Controllers should be defined in the `/controllers` directory
- Models should be defined in the `/models` directory
- Use middleware for cross-cutting concerns like authentication and tenant isolation
- API endpoints should follow the pattern `/api/v1/<resource>`

## Multi-Tenant Architecture

- Every API request should be scoped to a specific tenant using tenant middleware
- Tenants are identified by their domain or tenant ID
- Data isolation between tenants must be strictly enforced
- Each tenant has its own set of users and resources

## Authentication

- Use JWT for authentication with token-based access
- Include tenant information in the JWT payload
- Implement proper token refresh mechanisms
- Always hash passwords with bcrypt before storing

## Error Handling

- Use HTTP status codes appropriately
- Return consistent error response objects
- Include specific error messages for debugging but avoid exposing sensitive information
- Log errors for troubleshooting

## Database

- Use Mongoose schemas for data modeling
- Include proper validation rules in schemas
- Use MongoDB indexes for frequently queried fields
- Implement proper MongoDB connection handling

## Security

- Sanitize all user inputs
- Validate request data using express-validator
- Use helmet for HTTP security headers
- Implement proper CORS configuration
- Never expose sensitive information in responses

## Testing

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Use realistic test data that represents production scenarios

## Examples

### Example Model Pattern
```javascript
const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true // For faster tenant-based queries
  },
  // Other fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware
ResourceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resource', ResourceSchema);
```

### Example Controller Pattern
```javascript
/**
 * @desc    Get all resources for the current tenant
 * @route   GET /api/v1/resources
 * @access  Private
 */
exports.getResources = async (req, res, next) => {
  try {
    const resources = await Resource.find({ tenantId: req.tenant.id });
    
    res.status(200).json({
      success: true,
      count: resources.length,
      data: resources
    });
  } catch (error) {
    next(error);
  }
};
```

### Example Route Pattern
```javascript
const express = require('express');
const { protect } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenantMiddleware');
const { 
  getResources,
  createResource
} = require('../controllers/resourceController');

const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(tenantMiddleware);

router.route('/')
  .get(getResources)
  .post(createResource);

module.exports = router;
```
