const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { identifyTenantFromParam } = require('../middleware/tenantMiddleware');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');

// All routes require authentication
router.use(protect);
// Use tenant identification from URL parameter since the route includes tenantSlug
router.use(function(req, res, next) {
  return identifyTenantFromParam(req, res, next);
});

router.route('/')
  .get(getDepartments)
  .post(createDepartment);
  
router.route('/:id')
  .get(getDepartment)
  .put(updateDepartment)
  .delete(deleteDepartment);

module.exports = router;
