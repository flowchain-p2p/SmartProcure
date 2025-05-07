const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { 
  inviteSupplier, 
  getInvites, 
  verifyInvite,
  resendInvite,
  cancelInvite
} = require('../controllers/supplierInviteController');
const { protect } = require('../middleware/authMiddleware');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');
const { hasPermission } = require('../middleware/permissionMiddleware');

// Public route to verify invitation token
router.get('/verify-invite/:token', verifyInvite);

// Protected routes
router.use(protect);
router.use(identifyTenantFromToken);

// Send invitation
router.post(
  '/invite',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('phone', 'Phone number is optional').optional()
  ],
  //hasPermission('manage-suppliers'), 
  inviteSupplier
);

// Get all invitations
router.get('/invites', hasPermission('manage-suppliers'), getInvites);

// Resend invitation
router.post('/invites/:id/resend', hasPermission('manage-suppliers'), resendInvite);

// Cancel invitation
router.delete('/invites/:id', hasPermission('manage-suppliers'), cancelInvite);

module.exports = router;
