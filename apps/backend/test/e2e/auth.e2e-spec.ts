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
  const testEmail = 'e2e@example.com';

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
        expect(res.body.email).toEqual(testEmail);
        expect(res.body.firstName).toEqual('E2E');
      });
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'password123',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
        jwtToken = res.body.access_token;
      });
  });

  it('/auth/send-otp (POST)', async () => {
    // We need a NEW email for OTP as sendOtp throws if user exists
    const newEmail = 'otp@example.com';

    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ email: newEmail })
      .expect(201)
      .expect({ message: 'OTP sent successfully' });

    expect(mockMailService.sendOtp).toHaveBeenCalled();
  });

  it('/auth/verify-otp (POST)', async () => {
    const newEmail = 'otp@example.com';

    // Fetch the OTP from the DB
    const otpRecord = await otpRepository.findOne({
      where: { email: newEmail },
    });
    expect(otpRecord).toBeDefined();

    return request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        email: newEmail,
        code: otpRecord.code,
      })
      .expect(201)
      .expect({ message: 'OTP verified successfully' }); // Status 200 actually? AuthController says 200.
      // Wait, let's check AuthController.
      // @ApiResponse({ status: 200 ... })
      // async verifyOtp ...
      // But implementation calls authService.verifyOtp.
      // Let's assume 200 or 201. If it fails I'll fix it. The original test had .expect(201).
      // AuthController code:
      /*
      @Public()
      @Post('otp/verify')
      @ApiResponse({ status: 200 ... })
      async verifyOtp(...) { ... }
      */
      // NestJS default POST status is 201. Unless @HttpCode(200) is used.
      // AuthController login uses @HttpCode(HttpStatus.OK).
      // verifyOtp does NOT use @HttpCode. So it returns 201 by default.
      // So expectation of 201 is correct.
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
