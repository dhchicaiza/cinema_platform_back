/**
 * @fileoverview Email service for sending various types of emails
 * @description Handles email operations including password reset, welcome emails, and notifications
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-09-28
 */

import nodemailer, { Transporter } from 'nodemailer';
import { IEmailData } from '../types';
import { environment } from '../config/environment';

/**
 * @interface IEmailServiceConfig
 * @description Interface for email service configuration
 */
interface IEmailServiceConfig {
  service: string;
  user: string;
  password: string;
}

/**
 * @class EmailService
 * @description Manages email sending operations
 */
class EmailService {
  private transporter: Transporter;
  private config: IEmailServiceConfig;

  /**
   * @constructor
   * @description Initializes email service with configuration
   */
  constructor() {
    this.config = {
      service: environment.get('emailService'),
      user: environment.get('emailUser'),
      password: environment.get('emailPassword'),
    };

    this.transporter = this.createTransporter();
  }

  /**
   * @method createTransporter
   * @description Creates nodemailer transporter with configuration
   * @returns {Transporter} Configured nodemailer transporter
   * @private
   */
  private createTransporter(): Transporter {
    // Use SMTP configuration for services like Mailtrap, SendGrid, etc.
    if (this.config.service === 'smtp') {
      const smtpHost = process.env.SMTP_HOST || 'live.smtp.mailtrap.io';
      const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
      const smtpSecure = process.env.SMTP_SECURE === 'true';

      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: this.config.user,
          pass: this.config.password,
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false,
        },
      });
    }

    // Default to service-based configuration (Gmail, Outlook, etc.)
    return nodemailer.createTransport({
      service: this.config.service,
      auth: {
        user: this.config.user,
        pass: this.config.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * @method verifyConnection
   * @description Verifies email service connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      if (environment.isDevelopment()) {
        console.log('WARNING: Continuing in development mode - emails may not be sent');
        return true;
      }
      return false;
    }
  }

  /**
   * @method sendEmail
   * @description Sends an email using the configured transporter
   * @param {IEmailData} emailData - Email data to send
   * @returns {Promise<boolean>} True if email sent successfully
   */
  public async sendEmail(emailData: IEmailData): Promise<boolean> {
    try {
      const mailOptions = {
        from: `Movies Platform <${this.config.user}>`,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      };

      const result = await this.transporter.sendMail(mailOptions);

      if (environment.isDevelopment()) {
        console.log('Email sent successfully:', {
          to: emailData.to,
          subject: emailData.subject,
          messageId: result.messageId,
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * @method sendWelcomeEmail
   * @description Sends welcome email to new users
   * @param {string} email - User's email address
   * @param {string} firstName - User's first name
   * @returns {Promise<boolean>} True if email sent successfully
   */
  public async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const emailData: IEmailData = {
      to: email,
      subject: 'Welcome to Movies Platform!',
      text: `Welcome to Movies Platform, ${firstName}! We're excited to have you on board.`,
      html: this.generateWelcomeEmailHTML(firstName),
    };

    return this.sendEmail(emailData);
  }

  /**
   * @method sendPasswordResetEmail
   * @description Sends password reset email with reset link
   * @param {string} email - User's email address
   * @param {string} fullName - User's full name
   * @param {string} resetUrl - Password reset URL
   * @returns {Promise<boolean>} True if email sent successfully
   */
  public async sendPasswordResetEmail(
    email: string,
    fullName: string,
    resetUrl: string
  ): Promise<boolean> {
    const emailData: IEmailData = {
      to: email,
      subject: 'Password Reset Request - Movies Platform',
      text: `Hello ${fullName}, you requested a password reset. Click the link to reset your password: ${resetUrl}`,
      html: this.generatePasswordResetEmailHTML(fullName, resetUrl),
    };

    return this.sendEmail(emailData);
  }

  /**
   * @method sendPasswordResetConfirmationEmail
   * @description Sends confirmation email after successful password reset
   * @param {string} email - User's email address
   * @param {string} fullName - User's full name
   * @returns {Promise<boolean>} True if email sent successfully
   */
  public async sendPasswordResetConfirmationEmail(
    email: string,
    fullName: string
  ): Promise<boolean> {
    const emailData: IEmailData = {
      to: email,
      subject: 'Password Reset Successful - Movies Platform',
      text: `Hello ${fullName}, your password has been successfully reset.`,
      html: this.generatePasswordResetConfirmationEmailHTML(fullName),
    };

    return this.sendEmail(emailData);
  }

  /**
   * @method sendAccountDeletionEmail
   * @description Sends confirmation email after account deletion
   * @param {string} email - User's email address
   * @param {string} fullName - User's full name
   * @returns {Promise<boolean>} True if email sent successfully
   */
  public async sendAccountDeletionEmail(email: string, fullName: string): Promise<boolean> {
    const emailData: IEmailData = {
      to: email,
      subject: 'Account Deletion Confirmation - Movies Platform',
      text: `Hello ${fullName}, your account has been successfully deleted. We're sorry to see you go!`,
      html: this.generateAccountDeletionEmailHTML(fullName),
    };

    return this.sendEmail(emailData);
  }

  /**
   * @method generateWelcomeEmailHTML
   * @description Generates HTML content for welcome email
   * @param {string} firstName - User's first name
   * @returns {string} HTML email content
   * @private
   */
  private generateWelcomeEmailHTML(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Movies Platform</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Movies Platform!</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>We're thrilled to have you join our community of movie enthusiasts!</p>
            <p>Here's what you can do with your new account:</p>
            <ul>
              <li>Explore our vast collection of movies</li>
              <li>Rate and review your favorite films</li>
              <li>Create your personal favorites list</li>
              <li>Share your thoughts with comments</li>
              <li>Enjoy seamless streaming on any device</li>
            </ul>
            <p>Ready to start your movie journey?</p>
            <a href="${environment.get('frontendUrl')}" class="btn">Start Exploring Movies</a>
          </div>
          <div class="footer">
            <p>Thank you for choosing Movies Platform!</p>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * @method generatePasswordResetEmailHTML
   * @description Generates HTML content for password reset email
   * @param {string} fullName - User's full name
   * @param {string} resetUrl - Password reset URL
   * @returns {string} HTML email content
   * @private
   */
  private generatePasswordResetEmailHTML(fullName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Movies Platform</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .btn { display: inline-block; background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName},</h2>
            <p>We received a request to reset your password for your Movies Platform account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="btn">Reset My Password</a>
            <div class="warning">
              <strong>IMPORTANT:</strong>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>For security, this link can only be used once</li>
              </ul>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Your password will remain unchanged.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * @method generatePasswordResetConfirmationEmailHTML
   * @description Generates HTML content for password reset confirmation email
   * @param {string} fullName - User's full name
   * @returns {string} HTML email content
   * @private
   */
  private generatePasswordResetConfirmationEmailHTML(fullName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful - Movies Platform</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .btn { display: inline-block; background: #4facfe; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .success { background: #d1edff; border: 1px solid #4facfe; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Successful</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName},</h2>
            <div class="success">
              <p><strong>Great news!</strong> Your password has been successfully reset.</p>
            </div>
            <p>You can now log in to your Movies Platform account using your new password.</p>
            <a href="${environment.get('frontendUrl')}/login" class="btn">Log In Now</a>
            <p>If you didn't make this change or have any concerns about your account security, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>Thank you for keeping your account secure!</p>
            <p>Movies Platform Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * @method generateAccountDeletionEmailHTML
   * @description Generates HTML content for account deletion confirmation email
   * @param {string} fullName - User's full name
   * @returns {string} HTML email content
   * @private
   */
  private generateAccountDeletionEmailHTML(fullName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Deletion Confirmation - Movies Platform</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #8b4513; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Goodbye from Movies Platform</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName},</h2>
            <p>We're sorry to see you go! Your Movies Platform account has been successfully deleted.</p>
            <p>All your data, including:</p>
            <ul>
              <li>Profile information</li>
              <li>Favorite movies</li>
              <li>Ratings and reviews</li>
              <li>Comments</li>
            </ul>
            <p>...has been removed from our system.</p>
            <p>If you change your mind in the future, you're always welcome to create a new account and rejoin our movie-loving community!</p>
            <p>Thank you for being part of Movies Platform. We wish you all the best!</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>Movies Platform Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;