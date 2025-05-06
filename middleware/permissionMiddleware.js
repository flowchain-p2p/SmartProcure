const Role = require('../models/Role');
const User = require('../models/User');

/**
 * Check if user has required permission
 * @param {String} permission - Permission code to check
 */
exports.hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Fast path: Check permission cache first
      if (req.user.permissionCache && req.user.permissionCache.includes(permission)) {
        return next();
      }

      // Special case: Administrators always have all permissions
      // This check can use either roles string array (for backward compatibility)
      // or roleIds which would have a role with code 'administrator'
      if (req.user.roles && req.user.roles.includes('Administrator')) {
        return next();
      }

      // Get user with populated roleIds
      const user = await User.findById(req.user.id).populate({
        path: 'roleIds',
        select: 'code permissions inheritsFrom'
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Collect all user permissions from roleIds
      const userPermissions = new Set();
      
      // Check if user has any roleIds
      if (user.roleIds && user.roleIds.length > 0) {
        // Check if any role is Administrator (using code)
        const hasAdminRole = user.roleIds.some(role => role.code === 'administrator');
        if (hasAdminRole) {
          return next();
        }

        // Process permissions from roleIds
        for (const role of user.roleIds) {
          role.permissions.forEach(perm => userPermissions.add(perm));

          // Process inherited permissions
          if (role.inheritsFrom) {
            const parentRole = await Role.findOne({ code: role.inheritsFrom });
            if (parentRole) {
              parentRole.permissions.forEach(perm => userPermissions.add(perm));
            }
          }
        }
      }

      // Update permission cache
      user.permissionCache = [...userPermissions];
      await user.save();

      // Check if user has the required permission
      if (userPermissions.has(permission)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: `Access denied. Missing required permission: ${permission}`
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions'
      });
    }
  };
};
