const { v4: uuidv4 } = require('uuid');
const SupplierInvite = require('../models/SupplierInvite');
const { sendEmail } = require('../utils/emailUtils');

/**
 * Sends an invitation email to a supplier
 * @param {Object} inviteData - Data for the invitation
 * @param {string} inviteData.email - Supplier email
 * @param {string} inviteData.phone - Supplier phone (optional)
 * @param {Object} options - Additional options
 * @param {Object} options.tenant - The tenant sending the invitation
 * @param {Object} options.user - The user sending the invitation
 * @returns {Promise<Object>} - The created invitation
 */
const inviteSupplier = async (inviteData, options) => {
  const { email, phone } = inviteData;
  const { tenant, user } = options;

  // Generate a unique token with UUID
  const token = uuidv4();
  
  // Set expiry date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create base URL for invitation
  const baseUrl = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/supplier/onboard?token=${token}&tenantId=${tenant._id}`;

  try {
    // Create invite record
    const invite = await SupplierInvite.create({
      email,
      phone,
      token,
      expiresAt,
      status: 'pending',
      tenantId: tenant._id,
      invitedBy: user._id
    });

    // Prepare email content
    const emailContent = {
      from: `${tenant.name} <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `${tenant.name} - Supplier Onboarding Invitation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2>${tenant.name}</h2>
          </div>
          <div style="padding: 20px; border-radius: 5px; background-color: #f9f9f9;">
            <p>Hello,</p>
            <p>You have been invited to join ${tenant.name}'s supplier network.</p>
            <p>Click the button below to begin your onboarding process:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
            </div>
            <p>This invitation link will expire on ${expiresAt.toLocaleDateString()}.</p>
            <p>If you have any questions, please contact support at ${tenant.email || process.env.SUPPORT_EMAIL || 'support@instatenders.com'}.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} ${tenant.name}. All rights reserved.</p>
          </div>
        </div>
      `
    };    // Send email
    const emailResult = await sendEmail(emailContent);
    
    if (emailResult.success) {
      // Update record to mark email as sent
      invite.emailSent = true;
      await invite.save();
    } else {
      // Still save the invite even if email fails
      // This way we can try to resend later
      invite.emailSent = false;
      await invite.save();
      
      // Throw error if we're not allowing failed emails to continue
      if (!emailResult.allowContinue) {
        throw new Error('Failed to send supplier invitation email');
      }
    }

    return {
      success: true,
      invite: {
        id: invite._id,
        email: invite.email,
        phone: invite.phone,
        token: invite.token,
        inviteUrl,
        expiresAt: invite.expiresAt
      }
    };
  } catch (error) {
    console.error('Error sending supplier invitation:', error);
    throw new Error('Failed to send supplier invitation');
  }
};

/**
 * Verify an invitation token
 * @param {string} token - The invitation token
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object>} - The invitation if valid
 */
const verifyInvite = async (token, tenantId) => {
  try {
    const invite = await SupplierInvite.findOne({ 
      token,
      tenantId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!invite) {
      return { valid: false, message: 'Invalid or expired invitation' };
    }

    return { 
      valid: true, 
      invite: {
        id: invite._id,
        email: invite.email,
        phone: invite.phone,
        expiresAt: invite.expiresAt
      } 
    };
  } catch (error) {
    console.error('Error verifying invitation:', error);
    throw new Error('Failed to verify invitation');
  }
};

/**
 * Update an invitation status
 * @param {string} token - The invitation token
 * @param {string} status - New status ('accepted', 'cancelled', 'expired')
 * @returns {Promise<Object>} - The updated invitation
 */
const updateInviteStatus = async (token, status) => {
  try {
    const invite = await SupplierInvite.findOneAndUpdate(
      { token },
      { status },
      { new: true }
    );

    if (!invite) {
      return { success: false, message: 'Invitation not found' };
    }

    return { 
      success: true, 
      invite: {
        id: invite._id,
        email: invite.email,
        status: invite.status
      } 
    };
  } catch (error) {
    console.error('Error updating invitation status:', error);
    throw new Error('Failed to update invitation status');
  }
};

module.exports = {
  inviteSupplier,
  verifyInvite,
  updateInviteStatus
};
