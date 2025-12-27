import crypto from 'crypto';

/**
 * Generate password reset token
 * @returns {string} - Reset token
 */
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Set password reset token and expiry on admin user
 * @param {Object} adminUser - Admin user document
 * @returns {Promise<Object>} - Updated admin user
 */
export const setPasswordResetToken = async (adminUser) => {
  const resetToken = generateResetToken();
  const resetTokenExpiry = new Date();
  resetTokenExpiry.setTime(
    resetTokenExpiry.getTime() +
    parseInt(process.env.PASSWORD_RESET_EXPIRY || '3600000')
  );

  adminUser.resetToken = resetToken;
  adminUser.resetTokenExpiry = resetTokenExpiry;
  await adminUser.save();

  return { resetToken, resetTokenExpiry };
};

/**
 * Verify password reset token
 * @param {Object} adminUser - Admin user document
 * @param {string} token - Reset token
 * @returns {boolean} - Valid token
 */
export const verifyResetToken = (adminUser, token) => {
  if (!adminUser.resetToken || !adminUser.resetTokenExpiry) {
    return false;
  }

  if (adminUser.resetToken !== token) {
    return false;
  }

  if (new Date() > adminUser.resetTokenExpiry) {
    return false;
  }

  return true;
};

/**
 * Clear password reset token
 * @param {Object} adminUser - Admin user document
 * @returns {Promise<Object>} - Updated admin user
 */
export const clearPasswordResetToken = async (adminUser) => {
  adminUser.resetToken = null;
  adminUser.resetTokenExpiry = null;
  await adminUser.save();
  return adminUser;
};

