import express from 'express';
import AdminUser from '../../models/AdminUser.js';
import { validateAdminLogin } from '../../utils/validators.js';
import { adminLoginRateLimiter } from '../../middleware/rateLimiter.js';
import {
  setPasswordResetToken,
  verifyResetToken,
  clearPasswordResetToken,
} from '../../utils/passwordReset.js';
import emailService from '../../services/emailService.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * GET /admin/login
 * Login page
 */
router.get('/login', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', {
    title: 'Admin Login',
    error: req.query.error || null,
  });
});

/**
 * POST /admin/login
 * Process login
 */
router.post('/login', adminLoginRateLimiter, validateAdminLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin user
    const adminUser = await AdminUser.findOne({
      $or: [{ username }, { email: username }],
      isActive: true,
    });

    if (!adminUser) {
      return res.render('admin/login', {
        title: 'Admin Login',
        error: 'Invalid username or password',
      });
    }

    // Verify password
    const isValidPassword = await adminUser.comparePassword(password);

    if (!isValidPassword) {
      return res.render('admin/login', {
        title: 'Admin Login',
        error: 'Invalid username or password',
      });
    }

    // Create session
    req.session.adminId = adminUser._id.toString();
    req.session.username = adminUser.username;

    // Update last login
    adminUser.lastLoginAt = new Date();
    await adminUser.save();

    logger.info(`Admin logged in: ${adminUser.username}`);

    res.redirect('/admin/dashboard');
  } catch (error) {
    logger.error('Login error:', error);
    res.render('admin/login', {
      title: 'Admin Login',
      error: 'An error occurred during login',
    });
  }
});

/**
 * POST /admin/logout
 * Logout
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error('Logout error:', err);
    }
    res.redirect('/admin/login');
  });
});

/**
 * GET /admin/forgot-password
 * Forgot password page
 */
router.get('/forgot-password', (req, res) => {
  res.render('admin/forgot-password', {
    title: 'Forgot Password',
    message: req.query.message || null,
    error: req.query.error || null,
  });
});

/**
 * POST /admin/forgot-password
 * Send password reset email
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.render('admin/forgot-password', {
        title: 'Forgot Password',
        error: 'Email is required',
      });
    }

    // Find admin user
    const adminUser = await AdminUser.findOne({ email, isActive: true });

    if (!adminUser) {
      // Don't reveal if user exists
      return res.render('admin/forgot-password', {
        title: 'Forgot Password',
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const { resetToken } = await setPasswordResetToken(adminUser);

    // Build reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/admin/reset-password/${resetToken}`;

    // Send email
    await emailService.sendPasswordResetEmail(adminUser.email, resetToken, resetUrl);

    logger.info(`Password reset email sent to: ${adminUser.email}`);

    res.render('admin/forgot-password', {
      title: 'Forgot Password',
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.render('admin/forgot-password', {
      title: 'Forgot Password',
      error: 'An error occurred. Please try again.',
    });
  }
});

/**
 * GET /admin/reset-password/:token
 * Password reset page
 */
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find admin user with this token
    const adminUser = await AdminUser.findOne({
      resetToken: token,
      isActive: true,
    });

    if (!adminUser || !verifyResetToken(adminUser, token)) {
      return res.render('admin/reset-password', {
        title: 'Reset Password',
        error: 'Invalid or expired reset token',
        token: null,
      });
    }

    res.render('admin/reset-password', {
      title: 'Reset Password',
      token,
      error: null,
    });
  } catch (error) {
    logger.error('Reset password page error:', error);
    res.render('admin/reset-password', {
      title: 'Reset Password',
      error: 'An error occurred',
      token: null,
    });
  }
});

/**
 * POST /admin/reset-password/:token
 * Process password reset
 */
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || password.length < 8) {
      return res.render('admin/reset-password', {
        title: 'Reset Password',
        token,
        error: 'Password must be at least 8 characters long',
      });
    }

    if (password !== confirmPassword) {
      return res.render('admin/reset-password', {
        title: 'Reset Password',
        token,
        error: 'Passwords do not match',
      });
    }

    // Find admin user
    const adminUser = await AdminUser.findOne({
      resetToken: token,
      isActive: true,
    });

    if (!adminUser || !verifyResetToken(adminUser, token)) {
      return res.render('admin/reset-password', {
        title: 'Reset Password',
        token: null,
        error: 'Invalid or expired reset token',
      });
    }

    // Set new password
    await adminUser.setPassword(password);
    await clearPasswordResetToken(adminUser);

    logger.info(`Password reset successful for: ${adminUser.username}`);

    res.redirect('/admin/login?message=Password reset successful. Please login.');
  } catch (error) {
    logger.error('Reset password error:', error);
    res.render('admin/reset-password', {
      title: 'Reset Password',
      token: req.params.token,
      error: 'An error occurred. Please try again.',
    });
  }
});

export default router;

