/**
 * Domain utility functions for multi-tenant applications
 */

/**
 * Extract domain from email address
 * @param {String} email - Email address
 * @returns {String|null} Domain or null if invalid
 */
exports.extractDomain = (email) => {
  if (!email || typeof email !== 'string') {
    return null;
  }
  
  const parts = email.split('@');
  if (parts.length !== 2) {
    return null;
  }
  
  return parts[1].toLowerCase();
};

/**
 * Normalize domain (lowercase, trim)
 * @param {String} domain - Domain to normalize
 * @returns {String} Normalized domain
 */
exports.normalizeDomain = (domain) => {
  return domain.toLowerCase().trim();
};
