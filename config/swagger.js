const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');

// Swagger configuration options
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Flowchain Multi-tenant API',
      version: '1.0.0',
      description: 'API documentation for Flowchain multi-tenant procurement platform',
      contact: {
        name: 'Support Team',
        email: 'support@Flowchain.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Development server'
      }
    ],
    // Add security scheme definition
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  // Path to the API docs - include only JS files
  apis: [
    path.join(__dirname, '../docs/components.js'),
    path.join(__dirname, '../docs/*-routes.js'),
    path.join(__dirname, '../routes/*.js')
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerSpec,
  swaggerUi
};
