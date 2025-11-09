// Email service for sending verification and password reset emails
// This is a simple console-based implementation for development
// In production, you should integrate with a real email service like SendGrid, AWS SES, etc.

export interface EmailService {
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
}

class ConsoleEmailService implements EmailService {
  private getBaseUrl(): string {
    return process.env.BASE_URL || "http://localhost:5000";
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.getBaseUrl()}/verify-email?token=${token}`;
    
    console.log("\n========================================");
    console.log("📧 EMAIL VERIFICATION");
    console.log("========================================");
    console.log(`To: ${email}`);
    console.log(`Subject: Verify your email address`);
    console.log(`\nPlease verify your email address by clicking the link below:`);
    console.log(`\n${verificationUrl}`);
    console.log(`\nThis link will expire in 24 hours.`);
    console.log("========================================\n");
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.getBaseUrl()}/reset-password?token=${token}`;
    
    console.log("\n========================================");
    console.log("🔐 PASSWORD RESET");
    console.log("========================================");
    console.log(`To: ${email}`);
    console.log(`Subject: Reset your password`);
    console.log(`\nYou requested to reset your password. Click the link below:`);
    console.log(`\n${resetUrl}`);
    console.log(`\nThis link will expire in 1 hour.`);
    console.log(`\nIf you didn't request this, please ignore this email.`);
    console.log("========================================\n");
  }
}

// Export a singleton instance
export const emailService: EmailService = new ConsoleEmailService();

// Example production implementation with SendGrid (commented out)
/*
import sgMail from '@sendgrid/mail';

class SendGridEmailService implements EmailService {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY environment variable is required");
    }
    sgMail.setApiKey(apiKey);
  }

  private getBaseUrl(): string {
    return process.env.BASE_URL || "http://localhost:5000";
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.getBaseUrl()}/verify-email?token=${token}`;
    
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@trippirate.com',
      subject: 'Verify your email address',
      html: `
        <h2>Welcome to TripPirate!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Verify Email</a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `,
    };

    await sgMail.send(msg);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.getBaseUrl()}/reset-password?token=${token}`;
    
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@guide2go.com',
      subject: 'Reset your password',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await sgMail.send(msg);
  }
}

export const emailService: EmailService = new SendGridEmailService();
*/

