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
                          credits &&
                          (credits.sms || credits.email || credits.whatsapp)
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

  async sendSubscriptionRenewalReminder(params: {
    email: string;
    customerName: string;
    businessName: string;
    planName: string;
    daysLeft: number;
    isLapsed: boolean;
    clusterName: string;
    clusterStats?: { people: number; businesses: number };
    renewalUrl?: string;
  }) {
    const { subject, html } =
      this.generateSubscriptionRenewalReminderHtml(params);

    try {
      const { data } = await this.resend.emails.send({
        from: this.fromEmail,
        to: params.email,
        subject,
        html,
      });
      this.logger.log(
        `Subscription renewal reminder email sent to ${params.email}, id: ${data?.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error sending subscription renewal reminder email to ${params.email}:`,
        error,
      );
      return false;
    }
  }

  public generateSubscriptionRenewalReminderHtml(params: {
    customerName: string;
    businessName: string;
    planName: string;
    daysLeft: number;
    isLapsed: boolean;
    clusterName: string;
    clusterStats?: { people: number; businesses: number };
    renewalUrl?: string;
  }): { subject: string; html: string } {
    const {
      customerName,
      businessName,
      planName,
      daysLeft,
      isLapsed,
      clusterName,
      clusterStats,
      renewalUrl = 'https://vemtap.vercel.app/dashboard/settings/subscription',
    } = params;

    const people = clusterStats?.people ?? 0;
    const businesses = clusterStats?.businesses ?? 0;
    const peopleText = people.toLocaleString();
    const businessesText = businesses.toLocaleString();
    const daysText = `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;

    let subject: string;
    let badgeLabel: string;
    let headerTitle: string;
    let headerSubtitle: string;
    let headerGradient: string;
    let urgencyMessage: string;

    if (isLapsed) {
      subject = `Your offers left the ${clusterName} deals feed - Renew now`;
      badgeLabel = 'Subscription Lapsed';
      headerTitle = 'Offers Removed from Deals Feed';
      headerSubtitle = `Your subscription for <strong style="color: #ffffff;">${businessName}</strong> has ended.`;
      headerGradient =
        'linear-gradient(135deg, #DC2626 0%, #EF4444 45%, #F87171 100%)';
      urgencyMessage = `Your plan expired, so customers in <strong>${clusterName}</strong> can no longer see your deals. There are currently <strong>${businessesText} businesses</strong> reaching <strong>${peopleText} shoppers</strong> in your area. Renew now to restore your visibility immediately.`;
    } else if (daysLeft <= 3) {
      subject = `Urgent: Your ${planName} plan in ${clusterName} expires in ${daysText}`;
      badgeLabel = 'Action Required • Final Notice';
      headerTitle = `Expires in ${daysText}`;
      headerSubtitle = `Keep <strong style="color: #ffffff;">${businessName}</strong> active in the ${clusterName} deals feed.`;
      headerGradient =
        'linear-gradient(135deg, #EA580C 0%, #F97316 45%, #FB923C 100%)';
      urgencyMessage = `In <strong>${daysText}</strong>, your deals will automatically leave the <strong>${clusterName}</strong> feed while <strong>${businessesText} nearby businesses</strong> continue reaching <strong>${peopleText} local shoppers</strong>. Renew today to avoid losing your spot.`;
    } else {
      subject = `Reminder: Your ${planName} plan in ${clusterName} expires in ${daysLeft} days`;
      badgeLabel = 'Renewal Reminder';
      headerTitle = `Renewal Due in ${daysLeft} Days`;
      headerSubtitle = `Maintain continuous visibility for <strong style="color: #ffffff;">${businessName}</strong>.`;
      headerGradient =
        'linear-gradient(135deg, #4338CA 0%, #6366F1 45%, #8B5CF6 100%)';
      urgencyMessage = `Over <strong>${peopleText} shoppers</strong> browsed deals in <strong>${clusterName}</strong> this month, and <strong>${businessesText} businesses</strong> are staying visible. Renew your subscription to keep attracting customers without interruption.`;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
                
                <!-- Hero Header Banner -->
                <tr>
                  <td style="background: ${headerGradient}; padding: 44px 32px; text-align: center;">
                    <div style="display: inline-block; background: rgba(255, 255, 255, 0.18); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.25); padding: 6px 18px; border-radius: 9999px; margin-bottom: 18px;">
                      <span style="color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">${badgeLabel}</span>
                    </div>

                    <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">
                      ${headerTitle}
                    </h1>
                    <p style="color: #ffffff; opacity: 0.95; margin: 0; font-size: 15px; font-weight: 500; max-width: 440px; margin: 0 auto; line-height: 1.5;">
                      ${headerSubtitle}
                    </p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 36px 32px;">
                    
                    <div style="margin-bottom: 24px;">
                      <h2 style="margin: 0 0 10px 0; font-size: 19px; font-weight: 700; color: #0f172a;">
                        Hello ${customerName || 'there'},
                      </h2>
                      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569;">
                        ${urgencyMessage}
                      </p>
                    </div>

                    <!-- Cluster Performance Metrics Card -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px; margin-bottom: 28px;">
                      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #6366F1; margin-bottom: 16px;">
                        ${clusterName} Deals Feed Activity (Last 30 Days)
                      </div>

                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                        <tr>
                          <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Active Shoppers Browsing</td>
                          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;">
                            <span style="background-color: #e0e7ff; color: #3730a3; padding: 3px 10px; border-radius: 6px; font-size: 13px;">${peopleText}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Competitor Businesses Active</td>
                          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${businessesText}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Current Plan</td>
                          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${planName}</td>
                        </tr>
                      </table>
                    </div>

                    <!-- CTA Action Button -->
                    <div style="text-align: center; margin: 32px 0 16px 0;">
                      <a href="${renewalUrl}" style="display: inline-block; background: linear-gradient(135deg, #4338CA 0%, #6366F1 100%); color: #ffffff; padding: 16px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.35);">
                        ${isLapsed ? 'Reactivate Subscription' : 'Renew Subscription'}
                      </a>
                    </div>
                    
                    <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 14px;">
                      Questions or need help? Reply to this email or visit our <a href="mailto:support@vemtap.com" style="color: #6366F1; text-decoration: none; font-weight: 600;">Support Desk</a>.
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

  async sendDealGiftEmail(params: DealGiftEmailParams): Promise<boolean> {
    try {
      const { recipientEmail, senderName, note, offer, business, branch } = params;
      const safeSender = (senderName || 'A friend').trim();
      const safeBusinessName = business.name || 'VemTap Partner';
      const subject = `🎁 ${safeSender} sent you a deal: ${offer.name} at ${safeBusinessName}!`;

      const frontendUrl = this.resolveFrontendBaseUrl(params.frontendBaseUrl);

      const businessSlug = business.slug || 'deal';
      const claimUrl = `${frontendUrl}/deals/${businessSlug}/${offer.id}?ref=gift&email=${encodeURIComponent(recipientEmail)}&sender=${encodeURIComponent(safeSender)}`;

      const formatNaira = (val?: number) => {
        if (val === undefined || val === null || isNaN(val)) return null;
        return `₦${Number(val).toLocaleString('en-NG')}`;
      };

      const dealPriceStr = formatNaira(offer.calculatedPrice);
      const originalPriceStr = formatNaira(offer.originalPrice);

      let savingsText = '';
      if (offer.discountLabel) {
        savingsText = offer.discountLabel;
      } else if (
        offer.originalPrice &&
        offer.calculatedPrice &&
        offer.originalPrice > offer.calculatedPrice
      ) {
        const saved = offer.originalPrice - offer.calculatedPrice;
        const pct = Math.round((saved / offer.originalPrice) * 100);
        savingsText = `Save ${formatNaira(saved)} (${pct}% OFF)`;
      }

      const branchAddress = branch?.address || business.address || '';
      const branchLocation = [branchAddress, branch?.city, branch?.state]
        .filter(Boolean)
        .join(', ');
      const branchPhone = branch?.phone || business.phone || '';

      const expiryStr = offer.endDate
        ? new Date(offer.endDate).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'Ongoing';

      const escapeHtml = (str: string = '') =>
        str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
                
                <!-- Top Brand Strip -->
                <tr>
                  <td style="padding: 16px 28px; background-color: #0f172a; text-align: left;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td>
                          <span style="font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">Vem<span style="color: #38bdf8;">Tap</span> Deals</span>
                        </td>
                        <td align="right">
                          <span style="background: rgba(255,255,255,0.15); color: #e2e8f0; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em;">Special Gift</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Hero Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #8b5cf6 100%); padding: 36px 28px; text-align: center; color: #ffffff;">
                    <div style="font-size: 42px; margin-bottom: 8px;">🎁</div>
                    <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 800; line-height: 1.25; letter-spacing: -0.02em; color: #ffffff;">
                      ${safeSender} sent you a deal!
                    </h1>
                    <p style="margin: 0; font-size: 15px; color: #e0e7ff; line-height: 1.5; max-width: 460px; margin: 0 auto;">
                      You have been gifted an exclusive discount at <strong>${safeBusinessName}</strong>.
                    </p>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 30px 28px;">

                    ${
                      note
                        ? `
                    <!-- Personal Note Callout -->
                    <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-left: 5px solid #a855f7; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                      <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #9333ea; letter-spacing: 0.05em;">
                        Personal Message from ${safeSender}:
                      </p>
                      <p style="margin: 0; font-size: 14px; font-style: italic; color: #4c1d95; line-height: 1.6;">
                        &ldquo;${escapeHtml(note)}&rdquo;
                      </p>
                    </div>
                    `
                        : ''
                    }

                    <!-- Deal Preview Card -->
                    <div style="border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff; margin-bottom: 26px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);">
                      ${
                        offer.mainImage
                          ? `
                      <div style="width: 100%; height: 200px; max-height: 220px; overflow: hidden; background-color: #f1f5f9; text-align: center;">
                        <img src="${offer.mainImage}" alt="${escapeHtml(offer.name)}" style="width: 100%; height: 200px; object-fit: cover; display: block;" />
                      </div>
                      `
                          : ''
                      }
                      
                      <div style="padding: 20px;">
                        ${
                          savingsText
                            ? `
                        <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px; margin-bottom: 10px;">
                          ${savingsText}
                        </div>
                        `
                            : ''
                        }

                        <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                          ${escapeHtml(offer.name)}
                        </h2>

                        ${
                          offer.description
                            ? `
                        <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                          ${escapeHtml(offer.description)}
                        </p>
                        `
                            : ''
                        }

                        <!-- Pricing Table -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px;">
                          <tr>
                            <td valign="middle">
                              <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; display: block;">Deal Price</span>
                              <span style="font-size: 22px; font-weight: 800; color: #059669; letter-spacing: -0.02em;">
                                ${dealPriceStr || 'Discounted'}
                              </span>
                              ${
                                originalPriceStr
                                  ? `
                              <span style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-left: 8px; font-weight: 500;">
                                ${originalPriceStr}
                              </span>
                              `
                                  : ''
                              }
                            </td>
                            <td align="right" valign="middle">
                              <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; display: block;">Valid Until</span>
                              <span style="font-size: 13px; font-weight: 700; color: #1e293b;">
                                ${expiryStr}
                              </span>
                            </td>
                          </tr>
                        </table>

                        <!-- Location & Contact Info -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; color: #475569;">
                          <tr>
                            <td style="padding: 4px 0;">
                              📍 <strong>Location:</strong> ${escapeHtml(branchLocation || safeBusinessName)}
                            </td>
                          </tr>
                          ${
                            branchPhone
                              ? `
                          <tr>
                            <td style="padding: 4px 0;">
                              📞 <strong>Phone:</strong> <a href="tel:${branchPhone}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">${branchPhone}</a>
                            </td>
                          </tr>
                          `
                              : ''
                          }
                        </table>

                      </div>
                    </div>

                    <!-- 3-Step Guide (How It Works) -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 28px;">
                      <h3 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #1e293b;">
                        How to Claim & Redeem (3 Easy Steps):
                      </h3>

                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td valign="top" style="width: 32px; padding-bottom: 12px;">
                            <div style="width: 24px; height: 24px; background-color: #4f46e5; color: #ffffff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 800;">1</div>
                          </td>
                          <td valign="top" style="padding-bottom: 12px;">
                            <strong style="color: #0f172a; font-size: 13px;">Tap the Claim Button</strong>
                            <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.4;">
                              Click the green button below. Your email is already recognized so you won't lose your spot.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td valign="top" style="width: 32px; padding-bottom: 12px;">
                            <div style="width: 24px; height: 24px; background-color: #4f46e5; color: #ffffff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 800;">2</div>
                          </td>
                          <td valign="top" style="padding-bottom: 12px;">
                            <strong style="color: #0f172a; font-size: 13px;">Get Your Unique Claim Code</strong>
                            <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.4;">
                              Sign in or set your 6-digit PIN in seconds. A unique redemption code will appear on your screen.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td valign="top" style="width: 32px;">
                            <div style="width: 24px; height: 24px; background-color: #10b981; color: #ffffff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 800;">3</div>
                          </td>
                          <td valign="top">
                            <strong style="color: #0f172a; font-size: 13px;">Present at Store & Enjoy Savings!</strong>
                            <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.4;">
                              Visit <strong>${safeBusinessName}</strong>, show the code to the cashier/staff at payment, and get your deal.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Call To Action Button -->
                    <div style="text-align: center; margin: 30px 0 20px 0;">
                      <a href="${claimUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; padding: 18px 38px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4); letter-spacing: -0.01em;">
                        CLAIM THIS DEAL NOW &rarr;
                      </a>
                    </div>

                    <!-- Fallback Link -->
                    <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px; text-align: center; margin-top: 20px;">
                      <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">
                        If the button above does not work, copy and paste this link in your browser:
                      </p>
                      <a href="${claimUrl}" style="color: #4f46e5; font-size: 11px; word-break: break-all; font-weight: 600;">
                        ${claimUrl}
                      </a>
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 24px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #334155;">
                      VemTap Deals • Instant Local Savings
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                      &copy; ${new Date().getFullYear()} VemTap Technologies. All rights reserved.<br>
                      You received this email because ${safeSender} gifted you a deal via VemTap.
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

      await this.resend.emails.send({
        from: `${safeBusinessName} via VemTap <hello@vemtap.com>`,
        to: recipientEmail,
        subject,
        html,
      });

      this.logger.log(
        `Deal gift email sent to ${recipientEmail} from ${safeSender} for offer ${offer.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error sending deal gift email to ${params.recipientEmail}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Dynamically resolves the frontend base URL based on caller/request origin,
   * environment variables, and deployment environment:
   * - Localhost: preserves exact scheme, host, and serving port (e.g. http://localhost:3000, http://localhost:3002)
   * - Staging: https://vemtap.vercel.app
   * - Production: https://vemtap.com
   */
  resolveFrontendBaseUrl(candidateUrl?: string): string {
    if (candidateUrl && typeof candidateUrl === 'string') {
      const trimmed = candidateUrl.trim().replace(/\/+$/, '');
      if (trimmed) {
        try {
          const parsed = new URL(
            trimmed.startsWith('http://') || trimmed.startsWith('https://')
              ? trimmed
              : `https://${trimmed}`,
          );

          // If localhost / 127.0.0.1, preserve the exact scheme and port
          if (
            parsed.hostname === 'localhost' ||
            parsed.hostname === '127.0.0.1' ||
            parsed.hostname === '0.0.0.0'
          ) {
            return parsed.origin;
          }

          // If valid protocol and host, return origin
          if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.origin;
          }
        } catch {
          // Fall through if URL parsing fails
        }
      }
    }

    // Check explicit configuration from environment
    const envUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('VEMTAP_APP_URL') ||
      this.configService.get<string>('APP_URL');
    if (envUrl && typeof envUrl === 'string') {
      const trimmedEnv = envUrl.trim().replace(/\/+$/, '');
      if (trimmedEnv) {
        return trimmedEnv.startsWith('http')
          ? trimmedEnv
          : `https://${trimmedEnv}`;
      }
    }

    // Detect environment from NODE_ENV
    const nodeEnv = (
      this.configService.get<string>('NODE_ENV') ||
      process.env.NODE_ENV ||
      'development'
    ).toLowerCase();

    if (nodeEnv === 'production' || nodeEnv === 'prod') {
      return 'https://vemtap.com';
    }
    if (nodeEnv === 'staging') {
      return 'https://vemtap.vercel.app';
    }

    // Default for local development
    return 'http://localhost:3000';
  }
}

export interface DealGiftEmailParams {
  recipientEmail: string;
  senderName?: string;
  senderEmail?: string;
  note?: string;
  frontendBaseUrl?: string;
  offer: {
    id: string;
    name: string;
    description?: string;
    mainImage?: string;
    calculatedPrice?: number;
    originalPrice?: number;
    discountLabel?: string;
    endDate?: Date | string;
    terms?: string[];
  };
  business: {
    name: string;
    slug?: string;
    phone?: string;
    address?: string;
    logoUrl?: string;
  };
  branch?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
  };
}
