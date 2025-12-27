import dotenv from 'dotenv';
import { Resend } from '@resend/node';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

dotenv.config();

/**
 * Email service for sending emails (password reset, etc.)
 */
class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'resend';
    this.from = process.env.EMAIL_FROM || 'noreply@example.com';
    this.resend = null;
    this.transporter = null;

    this.initialize();
  }

  initialize() {
    if (this.provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        this.resend = new Resend(apiKey);
      } else {
        logger.warn('RESEND_API_KEY not set, email service disabled');
      }
    } else if (this.provider === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  /**
   * Send password reset email
   * @param {string} to - Recipient email
   * @param {string} resetToken - Password reset token
   * @param {string} resetUrl - Password reset URL
   * @returns {Promise<boolean>} - Success status
   */
  async sendPasswordResetEmail(to, resetToken, resetUrl) {
    const subject = 'Password Reset Request';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
      </head>
      <body>
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Or copy and paste this token: <code>${resetToken}</code></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  /**
   * Send email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @returns {Promise<boolean>} - Success status
   */
  async sendEmail(to, subject, html) {
    try {
      if (this.provider === 'resend' && this.resend) {
        const result = await this.resend.emails.send({
          from: this.from,
          to,
          subject,
          html,
        });
        logger.info('Email sent via Resend:', result);
        return true;
      } else if (this.provider === 'smtp' && this.transporter) {
        const info = await this.transporter.sendMail({
          from: this.from,
          to,
          subject,
          html,
        });
        logger.info('Email sent via SMTP:', info.messageId);
        return true;
      } else {
        logger.warn('Email service not configured, email not sent');
        // In development, log the email content
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Email would be sent:', { to, subject, html });
        }
        return false;
      }
    } catch (error) {
      logger.error('Email send error:', error);
      return false;
    }
  }
}

export default new EmailService();

