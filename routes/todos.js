const express = require('express');
const { check } = require('express-validator');
const { 
  getCatalogItems, 
  getCatalogItem, 
  createCatalogItem, 
  updateCatalogItem, 
  deleteCatalogItem
} = require('../controllers/catalogItemController');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');

const router = express.Router();

// Protect all routes
router.use(identifyTenantFromToken);

// Get all catalog items for the current user
router.get('/', getCatalogItems);

// Get single catalog item
router.get('/:id', getCatalogItem);

// Create a new catalog item
router.post('/', 
  [
    check('name', 'Name is required').not().isEmpty(),
    check('price', 'Price is required').isNumeric()
  ],
  createCatalogItem
);

// Update catalog item
router.put('/:id', updateCatalogItem);

// Delete catalog item
router.delete('/:id', deleteCatalogItem);

module.exports = router;