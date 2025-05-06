const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Load OpenAPI specification from YAML file
const YAML = require('yamljs');
const path = require('path');

// Load the OpenAPI specification
const swaggerOptions = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = {
  swaggerSpec,
  swaggerUi
};
