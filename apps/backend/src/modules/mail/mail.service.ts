import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport(
      {
        service: 'gmail', // Or 'smtp.gmail.com'
        auth: {
          user: this.configService.get<string>('EMAIL_USER'),
          pass: this.configService.get<string>('EMAIL_PASSWORD'),
        },
      },
      {
        cc: 'oyelakintobiloba@gmail.com',
      },
    );
  }

  async sendOtp(email: string, otp: string) {
    const mailOptions = {
      from:
        '"VemTap Support" <' +
        this.configService.get<string>('EMAIL_USER') +
        '>',
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
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, name: string, password?: string) {
    const mailOptions = {
      from:
        '"VemTap Support" <' +
        this.configService.get<string>('EMAIL_USER') +
        '>',
      to: email,
      subject: 'Welcome to VemTap!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4A90E2;">Welcome to VemTap, ${name}!</h2>
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
          <p style="font-size: 0.8em; color: #888;">&copy; ${new Date().getFullYear()} VemTap. All rights reserved.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  async sendPasswordResetOtp(email: string, otp: string) {
    const mailOptions = {
      from:
        '"VemTap Support" <' +
        this.configService.get<string>('EMAIL_USER') +
        '>',
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
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  async sendGenericEmail(email: string, subject: string, content: string) {
    const mailOptions = {
      from: '"VemTap" <' + this.configService.get<string>('EMAIL_USER') + '>',
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
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending generic email:', error);
      return false;
    }
  }

  async sendOrderNotification(
    email: string,
    order: any,
    status: 'placed' | 'processing' | 'completed' | 'cancelled' | 'rejected',
    business: { name: string; logo?: string; address?: string; phone?: string; website?: string },
  ) {
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
              ${order.items.map((item: any) => `
                <tr>
                  <td style="padding: 20px 0; border-bottom: 1px solid #f8fafc;">
                    <div style="font-weight: 600; color: #334155; font-size: 15px;">${item.item?.name || item.offer?.name || 'Item'}</div>
                    ${item.item?.shortDescription ? `<div style="font-size: 13px; color: #64748b; margin-top: 2px;">${item.item.shortDescription}</div>` : ''}
                  </td>
                  <td style="padding: 20px 0; text-align: center; color: #475569; font-weight: 500; border-bottom: 1px solid #f8fafc;">${item.quantity}</td>
                  <td style="padding: 20px 0; text-align: right; color: #1e293b; font-weight: 600; border-bottom: 1px solid #f8fafc;">₦${Number(item.priceAtOrder * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
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

    const htmlContent = `
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
                ${status === 'placed' ? `We've received your order and our team is already on it. Thank you for choosing us!` : 
                  status === 'processing' ? `Exciting news! Your order is currently being prepared with care.` : 
                  status === 'completed' ? `Your order is ready and waiting! We can't wait for you to experience it.` :
                  status === 'cancelled' ? `We're sorry, but your order has been cancelled. If this was a mistake, please reach out.` :
                  `Your order could not be fulfilled at this time and has been rejected.`}
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
                ${order.tableNumber ? `
                <tr>
                  <td style="color: #64748b; padding-bottom: 12px;">Table / Location</td>
                  <td style="text-align: right; font-weight: 600; color: #1e293b; padding-bottom: 12px;">${order.tableNumber}</td>
                </tr>
                ` : ''}
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

    const mailOptions = {
      from: `"${business.name} via VemTap" <${this.configService.get<string>('EMAIL_USER')}>`,
      to: email,
      subject,
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending order notification email:', error);
      return false;
    }
  }
}
