/**
 * Email service using Resend
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

// Import ENV from index.js (will be set per request)
let ENV = {};

export function setEnv(env) {
  ENV = env;
}

function getResendApiKey() {
  return ENV.RESEND_API_KEY || '';
}

/**
 * Send email via Resend
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const RESEND_API_KEY = getResendApiKey();
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kyvex API <noreply@kyvex.ai>',
        to,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, resetToken) {
  const adminPanelUrl = ENV.ADMIN_PANEL_URL || 'https://admin.kyvex.ai';
  const resetUrl = `${adminPanelUrl}/reset-password?token=${resetToken}`;
  
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested to reset your password for Kyvex API Admin Panel.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  const text = `
    Password Reset Request
    
    You requested to reset your password for Kyvex API Admin Panel.
    Click the link below to reset your password:
    ${resetUrl}
    
    This link will expire in 1 hour.
    If you didn't request this, please ignore this email.
  `;

  return await sendEmail({
    to: email,
    subject: 'Kyvex API - Password Reset',
    html,
    text,
  });
}

/**
 * Send API key creation notification
 */
export async function sendApiKeyCreatedEmail(adminEmail, apiKeyName, apiKey) {
  const html = `
    <h2>New API Key Created</h2>
    <p>A new API key has been created in your Kyvex API account.</p>
    <p><strong>Key Name:</strong> ${apiKeyName}</p>
    <p><strong>API Key:</strong> <code>${apiKey}</code></p>
    <p><strong>Important:</strong> Save this key securely. You won't be able to see it again.</p>
  `;

  const text = `
    New API Key Created
    
    A new API key has been created in your Kyvex API account.
    Key Name: ${apiKeyName}
    API Key: ${apiKey}
    
    Important: Save this key securely. You won't be able to see it again.
  `;

  return await sendEmail({
    to: adminEmail,
    subject: 'Kyvex API - New API Key Created',
    html,
    text,
  });
}

