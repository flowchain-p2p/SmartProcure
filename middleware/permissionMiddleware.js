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

      if (req.user.roles && req.user.roles.includes('administrator')) {
        return next();
      }

      if (req.user.permissionCache && req.user.permissionCache.includes(permission)) {
        return next();
      }

      const user = await User.findById(req.user.id).populate({
        path: 'roleIds',
        select: 'permissions inheritsFrom'
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const userPermissions = new Set();

      for (const role of user.roleIds) {
        role.permissions.forEach(perm => userPermissions.add(perm));

        if (role.inheritsFrom) {
          const parentRole = await Role.findOne({ code: role.inheritsFrom });
          if (parentRole) {
            parentRole.permissions.forEach(perm => userPermissions.add(perm));
          }
        }
      }

      user.permissionCache = [...userPermissions];
      await user.save();

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
