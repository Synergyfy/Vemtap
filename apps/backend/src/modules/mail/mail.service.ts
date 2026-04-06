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
    status: 'placed' | 'processing' | 'completed',
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
        statusColor = '#7ED321';
        break;
    }

    const receiptHtml = (status === 'completed' || status === 'placed') ? `
      <div style="margin-top: 30px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f9f9f9; padding: 15px; border-bottom: 1px solid #eee; font-weight: bold;">Order Receipt</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #fafafa;">
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #eee;">Item</th>
              <th style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">Qty</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item: any) => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                  <div style="font-weight: 500;">${item.item?.name || item.offer?.name || 'Item'}</div>
                  ${item.item?.shortDescription ? `<div style="font-size: 12px; color: #888;">${item.item.shortDescription}</div>` : ''}
                </td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">₦${Number(item.priceAtOrder * item.quantity).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold;">Total Amount:</td>
              <td style="padding: 15px; text-align: right; font-weight: bold; color: #333; font-size: 18px;">₦${Number(order.totalAmount).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    ` : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>\${subject}</title>
      </head>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: \${statusColor}; padding: 30px 20px; text-align: center;">
            <div style="color: rgba(255,255,255,0.9); font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">Order \${statusText}</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">\${business.name}</h1>
          </div>

          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 48px; margin-bottom: 15px;">
                \${status === 'placed' ? '🛒' : status === 'processing' ? '👨‍🍳' : '✅'}
              </div>
              <h2 style="margin: 0 0 10px 0; color: #222;">Hello \${order.customer?.firstName || 'Valued Customer'},</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0;">
                \${status === 'placed' ? \`Great news! Your order has been successfully placed and is now in our system.\` : 
                  status === 'processing' ? \`We've started working on your order! Our team is preparing everything just for you.\` : 
                  \`Your order is complete! We hope you enjoy it and look forward to serving you again soon.\`}
              </p>
            </div>

            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">Order ID:</td>
                  <td style="text-align: right; font-weight: 600; padding-bottom: 8px;">#\${order.id.slice(0, 8)}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">Date:</td>
                  <td style="text-align: right; font-weight: 600; padding-bottom: 8px;">\${new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
                \${order.tableNumber ? \`
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">Table Number:</td>
                  <td style="text-align: right; font-weight: 600; padding-bottom: 8px;">\${order.tableNumber}</td>
                </tr>
                \` : ''}
              </table>
            </div>

            \${receiptHtml}

            <div style="text-align: center; margin-top: 40px;">
              <a href="\${business.website || 'https://vemtap.vercel.app'}" style="display: inline-block; background-color: \${statusColor}; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">
                \${status === 'completed' ? 'Order Again' : 'View Order Details'}
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #444;">\${business.name}</p>
            <p style="margin: 0 0 5px 0; font-size: 13px; color: #666;">\${business.address || ''}</p>
            <p style="margin: 0 0 20px 0; font-size: 13px; color: #666;">\${business.phone || ''}</p>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p style="font-size: 12px; color: #9ca3af;">
                &copy; \${new Date().getFullYear()} \${business.name}. All rights reserved.<br>
                Powered by <a href="https://vemtap.vercel.app" style="color: #4A90E2; text-decoration: none;">VemTap</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"\${business.name} via VemTap" <\${this.configService.get<string>('EMAIL_USER')}>`,
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
