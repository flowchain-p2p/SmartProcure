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
  
  // Extract the company name from domain (before the first dot)
  const domain = parts[1].toLowerCase();
  
  return domain;
};

/**
 * Extract company slug from email address
 * @param {String} email - Email address
 * @returns {String|null} Company slug or null if invalid
 */
exports.extractCompanySlug = (email) => {
  if (!email || typeof email !== 'string') {
    return null;
  }
  
  const parts = email.split('@');
  if (parts.length !== 2) {
    return null;
  }
  
  // Extract the company name from domain (before the first dot)
  const domainParts = parts[1].split('.');
  return domainParts[0].toLowerCase();
  const companyName = domain.split('.')[0];
  
  return companyName;
};

/**
 * Normalize domain (lowercase, trim)
 * @param {String} domain - Domain to normalize
 * @returns {String} Normalized domain
 */
exports.normalizeDomain = (domain) => {
  return domain.toLowerCase().trim();
};
