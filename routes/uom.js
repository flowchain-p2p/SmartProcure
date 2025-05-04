const express = require('express');
const router = express.Router();
const { 
  getUnitsOfMeasure, 
  getUnitOfMeasure, 
  createUnitOfMeasure, 
  updateUnitOfMeasure, 
  deleteUnitOfMeasure 
} = require('../controllers/uomController');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');

// Protect all routes with tenant identification
router.use(identifyTenantFromToken);

router
  .route('/')
  .get(getUnitsOfMeasure)
  .post(createUnitOfMeasure);

router
  .route('/:id')
  .get(getUnitOfMeasure)
  .put(updateUnitOfMeasure)
  .delete(deleteUnitOfMeasure);

module.exports = router;
