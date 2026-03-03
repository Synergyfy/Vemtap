import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MailService } from '../../src/modules/mail/mail.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Otp } from '../../src/modules/auth/entities/otp.entity';
import { createTestApp } from '../utils/create-app';

describe('Auth & Notifications (e2e)', () => {
  let app: INestApplication;
  let otpRepository: any;

  // Mock MailService
  const mockMailService = {
    sendOtp: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    app = await createTestApp((builder) => {
      builder.overrideProvider(MailService).useValue(mockMailService);
    });

    otpRepository = app.get(getRepositoryToken(Otp));
  });

  afterAll(async () => {
    await app.close();
  });

  let jwtToken: string;
  const timestamp = Date.now();
  const testEmail = `e2e-${timestamp}@example.com`;

  it('/auth/otp/send (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/send')
      .send({ email: testEmail })
      .expect(201)
      .expect({ message: 'OTP sent successfully' });

    expect(mockMailService.sendOtp).toHaveBeenCalled();
  });

  it('/auth/otp/verify (POST)', async () => {
    // Fetch the OTP from the DB
    const otpRecord = await otpRepository.findOne({
      where: { email: testEmail },
      order: { createdAt: 'DESC' },
    });
    expect(otpRecord).toBeDefined();

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({
        email: testEmail,
        code: otpRecord.code,
      })
      .expect(200)
      .expect({ message: 'OTP verified successfully' });
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'E2E',
        lastName: 'Tester',
        email: testEmail,
        password: 'password123',
        businessName: 'Test Business',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.user.email).toEqual(testEmail);
        expect(res.body.user.firstName).toEqual('E2E');
        expect(res.body.access_token).toBeDefined();
      });
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: testEmail,
        password: 'password123',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
        jwtToken = res.body.access_token;
      });
  });

  it('/auth/login (POST) - case-insensitive email', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: testEmail.toUpperCase(),
        password: 'password123',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
      });
  });

  it('/auth/login (POST) - phone number', async () => {
    const phone = '+1234567890';
    // Create a user with phone
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/send')
      .send({ email: 'phone-test@example.com' })
      .expect(201);

    const otpRecord = await otpRepository.findOne({
      where: { email: 'phone-test@example.com' },
      order: { createdAt: 'DESC' },
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ email: 'phone-test@example.com', code: otpRecord.code })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Phone',
        lastName: 'Tester',
        email: 'phone-test@example.com',
        password: 'password123',
        phone: phone,
      })
      .expect(201);

    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: phone,
        password: 'password123',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
      });
  });

  it('/notifications (GET) - Protected', () => {
    return request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
