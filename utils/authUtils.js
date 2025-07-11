// Using dynamic import for jose as it's an ES Module
const CostCenter = require('../models/CostCenter');
const User = require('../models/User');
// Explicitly import and make the crypto module available globally
let crypto;
try {
  crypto = require('crypto');
  // Set crypto as a global variable in case it's not already defined
  if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto.webcrypto;
    console.log('[authUtils] Global crypto polyfilled successfully');
  }
  console.log('[authUtils] crypto module loaded:', typeof crypto);
} catch (err) {
  console.error('[authUtils] crypto module NOT loaded:', err);
}

console.log('[authUtils] typeof Buffer:', typeof Buffer);
console.log('[authUtils] process.versions.node:', process.versions.node);
console.log('[authUtils] process.env.NODE_ENV:', process.env.NODE_ENV);

// Cache the secret key for performance
let secretKey;

/**
 * Generate a JWT token with user information
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
exports.generateToken = async (user, tenant) => {
  console.log('[authUtils] generateToken called for user:', user.email, 'tenant:', tenant ? tenant.slug : 'none');  // Ensure crypto is available before importing jose
  if (typeof globalThis.crypto === 'undefined' && typeof crypto !== 'undefined') {
    globalThis.crypto = crypto.webcrypto;
    console.log('[authUtils] Global crypto set before jose import');
  }
  
  // Dynamic import for jose (ES Module)
  const { SignJWT } = await import('jose');
  
  if (!secretKey) {
    secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
  }
  const payload = {
    id: user._id.toString(), // Convert ObjectId to string
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId.toString() // Convert ObjectId to string
  };

  // Add tenant slug if tenant object is provided
  if (tenant && tenant.slug) {
    payload.tenantSlug = tenant.slug;
  }

  // Add cost center head status if available
  if (user.isCostCenterHead !== undefined) {
    payload.isCostCenterHead = user.isCostCenterHead;
  }

  // Sign the JWT
  let token;
  try {
    token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(secretKey);
    console.log('[authUtils] JWT token generated successfully');
  } catch (err) {
    console.error('[authUtils] Error generating JWT token:', err);
    throw err;
  }
  return token;
};

/**
 * Send token response with cookie
 * @param {Object} user - User object
 * @param {Number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {Object} tenant - Tenant object (optional)
 */
exports.sendTokenResponse = async (user, statusCode, res, tenant = null) => {
  // Create token
  let token;
  try {
    token = await this.generateToken(user, tenant);
  } catch (err) {
    console.error('[authUtils] Error in generateToken:', err);
    throw err;
  }
  // Decode the token without verification
  // In jose we can decode by splitting the token and decoding the payload (middle part)
  try {
    const [headerB64, payloadB64] = token.split('.');
    console.log('[authUtils] Decoding JWT payload:', payloadB64);
    // Base64 decode safely without relying on crypto
    // Handle padding for base64url format used in JWT
    const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice(0, (4 - (base64.length % 4)) % 4);
    // Use Buffer or atob depending on environment
    let jsonStr;
    if (typeof Buffer !== 'undefined') {
      jsonStr = Buffer.from(padded, 'base64').toString();
    } else {
      // For environments where Buffer is not available
      jsonStr = atob(padded);
    }
    const decoded = JSON.parse(jsonStr);
    console.log('[authUtils] Decoded JWT payload:', decoded);
    // Validate token expiration
    if (decoded.exp * 1000 < Date.now()) {
      throw new Error('Token has expired');
    }
  } catch (error) {
    console.error('[authUtils] Error decoding token:', error);
    // Continue without decoding - this is just for validation and doesn't affect token generation
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

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
exports.verifyToken = async (token) => {
  try {    // Ensure crypto is available before importing jose
    if (typeof globalThis.crypto === 'undefined' && typeof crypto !== 'undefined') {
      globalThis.crypto = crypto.webcrypto;
      console.log('[authUtils] Global crypto set before jose import in verifyToken');
    }
    
    // Dynamic import for jose (ES Module)
    const { jwtVerify } = await import('jose');
    
    if (!secretKey) {
      secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    }

    const { payload } = await jwtVerify(token, secretKey);
    
    // Ensure ID and tenantId are strings, not buffer objects
    if (payload.id && typeof payload.id !== 'string') {
      payload.id = payload.id.toString();
    }
    
    if (payload.tenantId && typeof payload.tenantId !== 'string') {
      payload.tenantId = payload.tenantId.toString();
    }
    
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};