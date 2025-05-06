const jwt = require('jsonwebtoken');
const CostCenter = require('../models/CostCenter');

/**
 * Generate JWT token for authentication
 * @param {Object} user - User object with id property
 * @param {Object} tenant - Tenant object (optional)
 * @returns {String} JWT token
 */
exports.generateToken = (user, tenant) => {
  // Create payload with user ID and tenant ID
  const payload = { id: user._id, tenantId: user.tenantId };
  
  // Add tenant slug if tenant object is provided
  if (tenant && tenant.slug) {
    payload.tenantSlug = tenant.slug;
  }
  
  // Add cost center head status if available
  if (user.isCostCenterHead !== undefined) {
    payload.isCostCenterHead = user.isCostCenterHead;
  }
  
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '1d' } // Hardcoded to 1 day
  );
  return token;
};

/**
 * Send token response with cookie
 * @param {Object} user - User object
 * @param {Number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {Object} tenant - Tenant object (optional)
 */
exports.sendTokenResponse = (user, statusCode, res, tenant = null) => {
  // Create token
  const token = this.generateToken(user, tenant);

  // Decode the token
  const decoded = jwt.decode(token);

  // Validate token expiration
  if (decoded.exp * 1000 < Date.now()) {
    throw new Error('Token has expired');
  }

  // Parse JWT_EXPIRES_IN to ensure it's a number
  const expiresInDays = parseInt(process.env.JWT_EXPIRES_IN, 10) || 30; // Default to 30 days if parsing fails
  
  const options = {
    expires: new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Use secure cookies in production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Remove password from output
  user.password = undefined;
  // Prepare response with tenant info if available
  const response = {
    success: true,
    token,
    user
  };

  // Add tenant information to the response if available
  if (tenant) {
    response.tenant = {
      _id: tenant._id,
      name: tenant.name,
      slug: tenant.slug
    };
  }

  res
    .status(statusCode)
    .cookie('jwt', token, options)
    .json(response);
};

/**
 * Check if user is a cost center head
 * @param {String} userId - User ID to check
 * @param {String} tenantId - Tenant ID
 * @returns {Promise<Boolean>} - True if user is a cost center head, false otherwise
 */
exports.isUserCostCenterHead = async (userId, tenantId) => {
  const count = await CostCenter.countDocuments({
    head: userId,
    tenantId: tenantId
  });
  
  return count > 0;
};