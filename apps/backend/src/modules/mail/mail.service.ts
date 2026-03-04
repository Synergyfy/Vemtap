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
      from:
        '"VemTap" <' + this.configService.get<string>('EMAIL_USER') + '>',
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
}
