const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { identifyTenantFromParam } = require('../middleware/tenantMiddleware');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  setUserDefaultLocation,
  manageUserLocations,
  getUserLocations
} = require('../controllers/userController');

// All routes require authentication
router.use(protect);
// Use tenant identification from URL parameter since the route includes tenantSlug
router.use(function(req, res, next) {
  return identifyTenantFromParam(req, res, next);
});

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

// User location management routes
router.route('/:id/defaultLocation')
  .put(setUserDefaultLocation);

router.route('/:id/locations')
  .get(getUserLocations)
  .put(manageUserLocations);

module.exports = router;
