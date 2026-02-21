import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/modules/mail/mail.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Otp } from '../src/modules/auth/entities/otp.entity';

describe('Auth & Notifications (e2e)', () => {
  let app: INestApplication;
  let otpRepository: any;

  // Mock MailService
  const mockMailService = {
    sendOtp: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    // Set env var for DB type
    process.env.DB_TYPE = 'sqlite';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRATION = '1h';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Access OTP repo to peek at codes if needed (or we mock the Otp entity logic, but we are e2e testing so we should use the DB)
    // Actually, with SQLite we can query the repo directly in the test to find the OTP code.
    otpRepository = moduleFixture.get(getRepositoryToken(Otp));
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
    // We need a NEW email for OTP as sendOtp throws if user exists (based on current logic? let's check)
    // AuthService.sendOtp throws ConflictException if user exists.
    // So we use a different email.
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

    // Fetch the OTP from the in-memory DB
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
      .expect({ message: 'OTP verified successfully' });
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
