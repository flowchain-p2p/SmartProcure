const express = require('express');
const router = express.Router();
const { 
  getUnitsOfMeasure, 
  getUnitOfMeasure, 
  createUnitOfMeasure, 
  updateUnitOfMeasure, 
  deleteUnitOfMeasure 
} = require('../controllers/uomController');

// All routes here require authentication and tenant context
// The tenant middleware should be applied at the app level

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
