import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail = 'VemTap <hello@vemtap.com>';

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async sendOtp(email: string, otp: string) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Verify your VemTap Account',
        html: `
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
            <h2>Verify your Email</h2>
            <p>Use the code below to complete your registration:</p>
            <h1 style="background: #f4f4f4; display: inline-block; padding: 10px 20px; border-radius: 8px; letter-spacing: 5px;">${otp}</h1>
            <p>This code expires in 10 minutes.</p>
          </div>
        `,
      });
      this.logger.log(`OTP sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending OTP email to ${email}:`, error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, code: string) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Verify your VemTap email address',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Verify your email address</h2>
            <p>Use the verification code below to confirm your VemTap email address:</p>
            <h1 style="letter-spacing: 5px;">${code}</h1>
            <p>This code expires in 10 minutes.</p>
          </div>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending verification email to ${email}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    password?: string,
    businessName?: string,
    branchName?: string,
  ) {
    const placeName =
      businessName && branchName
        ? `${businessName}, ${branchName}`
        : businessName || branchName || 'VemTap';

    const subject = `Welcome to ${placeName}!`;
    const sender = businessName
      ? `${businessName} via VemTap <hello@vemtap.com>`
      : this.fromEmail;

    try {
      await this.resend.emails.send({
        from: sender,
        to: email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4A90E2;">Welcome to ${placeName}, ${name}!</h2>
            <p>We are excited to have you on board. Your account has been successfully created.</p>
            ${password ? `<p>Your default login password is: <strong>${password}</strong></p><p>We recommend changing it after your first login.</p>` : ''}
            <p>You can now sign in to your dashboard to manage your visits and explore our features.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://vemtap.vercel.app/login" style="background-color: #4A90E2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Sign In to VemTap</a>
            </div>
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            <p><a href="https://vemtap.vercel.app/login">https://vemtap.vercel.app/login</a></p>
            <br>
            <p>Visit our website to learn more: <a href="https://vemtap.vercel.app">https://vemtap.vercel.app</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
            <p style="font-size: 0.8em; color: #888;">&copy; ${new Date().getFullYear()} ${businessName || 'VemTap'}. All rights reserved.</p>
          </div>
        `,
      });
      this.logger.log(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${email}:`, error);
      return false;
    }
  }

  async sendPasswordResetOtp(email: string, otp: string) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset your VemTap Password',
        html: `
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Use the code below to proceed:</p>
            <h1 style="background: #f4f4f4; display: inline-block; padding: 10px 20px; border-radius: 8px; letter-spacing: 5px; color: #d9534f;">${otp}</h1>
            <p>This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`Password reset OTP sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error sending password reset email to ${email}:`,
        error,
      );
      return false;
    }
  }

  async sendGenericEmail(email: string, subject: string, content: string) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <div style="padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              ${content.replace(/\n/g, '<br>')}
            </div>
            <p style="font-size: 0.8em; color: #888; margin-top: 30px;">
              Sent via VemTap Messaging Center
            </p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      this.logger.error(`Error sending generic email to ${email}:`, error);
      return false;
    }
  }

  async sendOrderNotification(
    email: string,
    order: any,
    status: 'placed' | 'processing' | 'completed' | 'cancelled' | 'rejected',
    business: {
      name: string;
      logo?: string;
      address?: string;
      phone?: string;
      website?: string;
    },
  ) {
    const { subject, html } = this.generateOrderNotificationHtml(
      order,
      status,
      business,
    );

    try {
      const { data } = await this.resend.emails.send({
        from: `${business.name} via VemTap <hello@vemtap.com>`,
        to: email,
        subject,
        html,
      });
      this.logger.log(
        `Order notification email sent to ${email}, id: ${data?.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending order notification email:', error);
      return false;
    }
  }

  public generateOrderNotificationHtml(
    order: any,
    status: 'placed' | 'processing' | 'completed' | 'cancelled' | 'rejected',
    business: {
      name: string;
      logo?: string;
      address?: string;
      phone?: string;
      website?: string;
    },
  ): { subject: string; html: string } {
    let subject = '';
    let statusText = '';
    let statusColor = '#4A90E2';

    switch (status) {
      case 'placed':
        subject = `Order Confirmation #${order.id.slice(0, 8)}`;
        statusText = 'Order Placed';
        statusColor = '#4A90E2';
        break;
      case 'processing':
        subject = `Your order #${order.id.slice(0, 8)} is being prepared`;
        statusText = 'Processing';
        statusColor = '#F5A623';
        break;
      case 'completed':
        subject = `Order Delivered! #${order.id.slice(0, 8)}`;
        statusText = 'Completed';
        statusColor = '#10B981';
        break;
      case 'cancelled':
        subject = `Order Cancelled #${order.id.slice(0, 8)}`;
        statusText = 'Cancelled';
        statusColor = '#EF4444';
        break;
      case 'rejected':
        subject = `Order Rejected #${order.id.slice(0, 8)}`;
        statusText = 'Rejected';
        statusColor = '#4B5563';
        break;
    }

    const receiptHtml = `
      <div style="margin-top: 32px; background: #ffffff; border-radius: 16px; border: 1px solid #f1f5f9; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
        <div style="background-color: #f8fafc; padding: 16px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; color: #1e293b; font-size: 16px;">Order Receipt</span>
          <span style="color: #64748b; font-size: 14px;">#${order.id.slice(0, 8)}</span>
        </div>
        <div style="padding: 0 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="padding: 16px 0; text-align: left; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9;">Item Details</th>
                <th style="padding: 16px 0; text-align: center; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9;">Qty</th>
                <th style="padding: 16px 0; text-align: right; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item: any) => `
                <tr>
                  <td style="padding: 20px 0; border-bottom: 1px solid #f8fafc;">
                    <div style="font-weight: 600; color: #334155; font-size: 15px;">${item.item?.name || item.offer?.name || 'Item'}</div>
                    ${item.item?.shortDescription ? `<div style="font-size: 13px; color: #64748b; margin-top: 2px;">${item.item.shortDescription}</div>` : ''}
                  </td>
                  <td style="padding: 20px 0; text-align: center; color: #475569; font-weight: 500; border-bottom: 1px solid #f8fafc;">${item.quantity}</td>
                  <td style="padding: 20px 0; text-align: right; color: #1e293b; font-weight: 600; border-bottom: 1px solid #f8fafc;">₦${Number(item.priceAtOrder * item.quantity).toLocaleString()}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </div>
        <div style="background-color: #f8fafc; padding: 24px; border-top: 1px solid #f1f5f9;">
          <table style="width: 100%;">
            <tr>
              <td style="color: #64748b; font-weight: 500;">Subtotal</td>
              <td style="text-align: right; color: #1e293b; font-weight: 600;">₦${Number(order.totalAmount).toLocaleString()}</td>
            </tr>
            <tr style="font-size: 20px;">
              <td style="padding-top: 12px; color: #1e293b; font-weight: 800;">Total</td>
              <td style="padding-top: 12px; text-align: right; color: ${statusColor}; font-weight: 800;">₦${Number(order.totalAmount).toLocaleString()}</td>
            </tr>
          </table>
        </div>
      </div>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <title>${subject}</title>
      </head>
      <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fdfdfd; margin: 0; padding: 0; color: #1e293b; line-height: 1.6;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); padding: 48px 32px; text-align: center;">
             <div style="display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 8px 16px; border-radius: 99px; margin-bottom: 20px;">
                <span style="color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Order ${statusText}</span>
             </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.02em;">${business.name}</h1>
          </div>

          <div style="padding: 48px 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="font-size: 64px; margin-bottom: 24px;">
                ${status === 'placed' ? '🛍️' : status === 'processing' ? '🧑‍🍳' : status === 'completed' ? '✨' : status === 'cancelled' ? '❌' : '🚫'}
              </div>
              <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 24px; font-weight: 700;">Hi ${order.customer?.firstName || 'Valued Customer'},</h2>
              <p style="color: #64748b; font-size: 16px; margin: 0; max-width: 400px; margin: 0 auto;">
                ${
                  status === 'placed'
                    ? `We've received your order and our team is already on it. Thank you for choosing us!`
                    : status === 'processing'
                      ? `Exciting news! Your order is currently being prepared with care.`
                      : status === 'completed'
                        ? `Your order is ready and waiting! We can't wait for you to experience it.`
                        : status === 'cancelled'
                          ? `We're sorry, but your order has been cancelled. If this was a mistake, please reach out.`
                          : `Your order could not be fulfilled at this time and has been rejected.`
                }
              </p>
            </div>

            <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #f1f5f9; margin-bottom: 32px;">
              <div style="font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 16px;">Order Summary</div>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="color: #64748b; padding-bottom: 12px;">Order reference</td>
                  <td style="text-align: right; font-weight: 600; color: #1e293b; padding-bottom: 12px;">#${order.id.slice(0, 8)}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 12px;">Order date</td>
                  <td style="text-align: right; font-weight: 600; color: #1e293b; padding-bottom: 12px;">${new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</td>
                </tr>
                ${
                  order.tableNumber
                    ? `
                <tr>
                  <td style="color: #64748b; padding-bottom: 12px;">Table / Location</td>
                  <td style="text-align: right; font-weight: 600; color: #1e293b; padding-bottom: 12px;">${order.tableNumber}</td>
                </tr>
                `
                    : ''
                }
              </table>
            </div>

            ${receiptHtml}

            <div style="text-align: center; margin-top: 48px;">
              <a href="${business.website || 'https://vemtap.vercel.app'}" style="display: inline-block; background-color: ${statusColor}; color: #ffffff; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 10px 15px -3px ${statusColor}44; transition: all 0.2s ease;">
                ${status === 'completed' ? 'Order Again' : 'Track Order Status'}
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 48px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
            <div style="margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #1e293b; font-size: 18px;">${business.name}</p>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #64748b;">${business.address || ''}</p>
              <p style="margin: 0 0 0 0; font-size: 14px; color: #64748b;">${business.phone || ''}</p>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 32px;">
              <p style="font-size: 12px; color: #94a3b8; line-height: 1.8;">
                &copy; ${new Date().getFullYear()} ${business.name}. All rights reserved.<br>
                This was sent by <a href="https://vemtap.vercel.app" style="color: #4A90E2; font-weight: 600; text-decoration: none;">VemTap</a> on behalf of ${business.name}.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  }

  async sendPlanChangeEmail(params: {
    email: string;
    customerName: string;
    businessName: string;
    planName: string;
    billingPeriod?: string;
    startDate?: Date;
    endDate?: Date;
    isTrial?: boolean;
    isAdminOverride?: boolean;
    isExpiredDowngrade?: boolean;
    previousPlanName?: string;
    currency?: string;
    amount?: number | string;
    features?: string[];
    credits?: {
      sms?: number;
      email?: number;
      whatsapp?: number;
    };
    limits?: {
      branches?: number;
      teamMembers?: number | null;
      catalogueItems?: number | null;
    };
  }) {
    const { subject, html } = this.generatePlanChangeEmailHtml(params);

    try {
      const { data } = await this.resend.emails.send({
        from: this.fromEmail,
        to: params.email,
        subject,
        html,
      });
      this.logger.log(
        `Plan change email sent to ${params.email}, id: ${data?.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error sending plan change email to ${params.email}:`,
        error,
      );
      return false;
    }
  }

  public generatePlanChangeEmailHtml(params: {
    customerName: string;
    businessName: string;
    planName: string;
    billingPeriod?: string;
    startDate?: Date;
    endDate?: Date;
    isTrial?: boolean;
    isAdminOverride?: boolean;
    isExpiredDowngrade?: boolean;
    previousPlanName?: string;
    currency?: string;
    amount?: number | string;
    features?: string[];
    credits?: {
      sms?: number;
      email?: number;
      whatsapp?: number;
    };
    limits?: {
      branches?: number;
      teamMembers?: number | null;
      catalogueItems?: number | null;
    };
  }): { subject: string; html: string } {
    const {
      customerName,
      businessName,
      planName,
      billingPeriod,
      startDate = new Date(),
      endDate,
      isTrial = false,
      isAdminOverride = false,
      isExpiredDowngrade = false,
      previousPlanName,
      features = [],
      credits,
      limits,
    } = params;

    const subject = isExpiredDowngrade
      ? `Your ${previousPlanName || 'VemTap'} Plan Expired — Free Plan Activated - VemTap`
      : isTrial
        ? `Your ${planName} Trial is Now Active! - VemTap`
        : isAdminOverride
          ? `Your Plan has been Updated to ${planName} - VemTap`
          : `Subscription Confirmation: You're now on the ${planName} - VemTap`;

    const formattedBilling = billingPeriod
      ? billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)
      : 'Active';

    const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const formattedEndDate = endDate
      ? new Date(endDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'Continuous';

    const badgeLabel = isExpiredDowngrade
      ? 'Subscription Expired • Free Plan Active'
      : isTrial
        ? 'Trial Activated'
        : isAdminOverride
          ? 'Plan Updated by Admin'
          : 'Plan Subscribed';

    const headerTitle = isExpiredDowngrade
      ? 'Subscription Expired'
      : 'Plan Activated';

    const headerSubtitle = isExpiredDowngrade
      ? `Your previous subscription has ended. Your business <strong style="color: #ffffff;">${businessName}</strong> has been switched to the <strong style="color: #ffffff;">${planName}</strong> so your operations continue.`
      : `Your business <strong style="color: #ffffff;">${businessName}</strong> is now equipped with the <strong style="color: #ffffff;">${planName}</strong>.`;

    const greetingBody = isExpiredDowngrade
      ? `Your previous subscription to <strong>${previousPlanName || 'your paid plan'}</strong> has expired and was not renewed. To ensure your business operations continue uninterrupted, we have automatically transitioned <strong>${businessName}</strong> to the <strong>${planName}</strong>. You can renew or upgrade at any time to restore premium features and higher limits.`
      : isAdminOverride
        ? `An administrator has updated your subscription package for <strong>${businessName}</strong>. You now have immediate access to all entitlements and features associated with this plan.`
        : `Thank you for choosing VemTap. Your subscription has been successfully updated and your new tier benefits are ready to use.`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04); border: 1px solid #e2e8f0;">
                
                <!-- Hero Header Banner with Gradient & Visual Illustration -->
                <tr>
                  <td style="background: linear-gradient(135deg, #4338CA 0%, #6366F1 45%, #8B5CF6 100%); padding: 44px 32px; text-align: center; position: relative;">
                    <!-- VemTap Brand Pill -->
                    <div style="display: inline-block; background: rgba(255, 255, 255, 0.16); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.25); padding: 6px 18px; border-radius: 9999px; margin-bottom: 20px;">
                      <span style="color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;">${badgeLabel}</span>
                    </div>

                    <!-- Visual Icon Shield / Sparkle -->
                    <div style="margin: 0 auto 16px auto; width: 68px; height: 68px; background: rgba(255, 255, 255, 0.2); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.35); box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);">
                      <span style="font-size: 34px; line-height: 1;">⚡</span>
                    </div>

                    <!-- Header Title -->
                    <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2;">
                      ${headerTitle}
                    </h1>
                    <p style="color: #e0e7ff; margin: 0; font-size: 15px; font-weight: 500; max-width: 440px; margin: 0 auto; line-height: 1.5;">
                      ${headerSubtitle}
                    </p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 36px 32px;">
                    
                    <!-- Greeting -->
                    <div style="margin-bottom: 24px;">
                      <h2 style="margin: 0 0 8px 0; font-size: 19px; font-weight: 700; color: #0f172a;">
                        Hello ${customerName || 'there'},
                      </h2>
                      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569;">
                        ${greetingBody}
                      </p>
                    </div>

                    ${
                      previousPlanName && previousPlanName !== planName
                        ? `
                    <!-- Plan Change Pill Banner -->
                    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 12px 18px; margin-bottom: 24px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                      <span style="font-size: 12px; color: #64748b; font-weight: 600;">Plan Transition:</span>
                      <div style="font-size: 13px; font-weight: 700; color: #1e293b;">
                        <span style="color: #94a3b8; text-decoration: line-through;">${previousPlanName}</span>
                        <span style="color: #6366F1; margin: 0 6px;">→</span>
                        <span style="color: #4338CA;">${planName}</span>
                      </div>
                    </div>
                    `
                        : ''
                    }

                    <!-- Subscription Details Card -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px; margin-bottom: 28px;">
                      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #6366F1; margin-bottom: 18px;">
                        Plan Overview
                      </div>

                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                        <tr>
                          <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Plan Name</td>
                          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;">
                            <span style="background-color: #e0e7ff; color: #3730a3; padding: 3px 10px; border-radius: 6px; font-size: 13px;">${planName}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Billing Cycle</td>
                          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${formattedBilling}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Effective Date</td>
                          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${formattedStartDate}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Next Renewal / Expiry</td>
                          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${formattedEndDate}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Account Status</td>
                          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #16a34a;">● Active</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Features & Entitlements Section -->
                    ${
                      features.length > 0 || credits || limits
                        ? `
                    <div style="margin-bottom: 32px;">
                      <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #0f172a; margin-bottom: 14px;">
                        What's Included with ${planName}
                      </div>

                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        ${
                          credits && (credits.sms || credits.email || credits.whatsapp)
                            ? `
                        <tr>
                          <td style="padding: 6px 0; font-size: 13px; color: #334155;">
                            <span style="color: #6366F1; font-weight: bold; margin-right: 8px;">✓</span>
                            <strong>Included Credits:</strong> 
                            ${credits.sms ? `${credits.sms.toLocaleString()} SMS` : ''}${credits.sms && credits.email ? ', ' : ''}
                            ${credits.email ? `${credits.email.toLocaleString()} Email` : ''}${(credits.sms || credits.email) && credits.whatsapp ? ', ' : ''}
                            ${credits.whatsapp ? `${credits.whatsapp.toLocaleString()} WhatsApp` : ''}
                          </td>
                        </tr>
                        `
                            : ''
                        }
                        ${
                          limits?.branches
                            ? `
                        <tr>
                          <td style="padding: 6px 0; font-size: 13px; color: #334155;">
                            <span style="color: #6366F1; font-weight: bold; margin-right: 8px;">✓</span>
                            <strong>Branch Limit:</strong> ${limits.branches} location${limits.branches > 1 ? 's' : ''}
                          </td>
                        </tr>
                        `
                            : ''
                        }
                        ${features
                          .slice(0, 6)
                          .map(
                            (f) => `
                        <tr>
                          <td style="padding: 6px 0; font-size: 13px; color: #334155;">
                            <span style="color: #6366F1; font-weight: bold; margin-right: 8px;">✓</span>
                            ${f}
                          </td>
                        </tr>
                        `,
                          )
                          .join('')}
                      </table>
                    </div>
                    `
                        : ''
                    }

                    <!-- CTA Action Button -->
                    <div style="text-align: center; margin: 32px 0 16px 0;">
                      <a href="${isExpiredDowngrade ? 'https://vemtap.vercel.app/dashboard/settings/subscription' : 'https://vemtap.vercel.app/dashboard'}" style="display: inline-block; background: linear-gradient(135deg, #4338CA 0%, #6366F1 100%); color: #ffffff; padding: 16px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.35); letter-spacing: -0.01em;">
                        ${isExpiredDowngrade ? 'Renew / Upgrade Plan' : 'Go to Your Dashboard'}
                      </a>
                    </div>
                    
                    <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 14px;">
                      Need assistance or have questions? Contact us anytime at <a href="mailto:support@vemtap.com" style="color: #6366F1; text-decoration: none; font-weight: 600;">support@vemtap.com</a>
                    </p>

                  </td>
                </tr>

                <!-- Clean Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 28px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <div style="margin-bottom: 12px;">
                      <span style="font-weight: 800; font-size: 16px; color: #1e293b; letter-spacing: -0.02em;">VemTap</span>
                    </div>
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                      &copy; ${new Date().getFullYear()} VemTap Technologies. All rights reserved.<br>
                      This is an automated notification regarding your subscription status.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return { subject, html };
  }
}

