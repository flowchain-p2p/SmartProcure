const { validationResult } = require('express-validator');
const Tenant = require('../models/Tenant');
const { extractDomain } = require('../utils/domainUtils');

/**
 * @desc    Check if domain exists from email
 * @route   POST /api/v1/domain/check
 * @access  Public
 */
exports.checkDomain = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    
    // Extract domain from email
    const domain = extractDomain(email);
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    // Find tenant by domain
    const tenant = await Tenant.findByDomain(domain);
    if (!tenant) {
     return res.status(401).json({
        success: false,
        error: 'Your organization is not registered with us',
        domain: domain
      });
    }

    // Return success with tenant info for redirection
    return res.status(200).json({
      success: true,
      data: {
        domain,
        tenantSlug: tenant.slug,
        tenantName: tenant.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
