import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MailService } from '../../src/modules/mail/mail.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Otp } from '../../src/modules/auth/entities/otp.entity';
import { createTestApp } from '../utils/create-app';
import { DataSource } from 'typeorm';
import { Category } from '../../src/modules/businesses/entities/category.entity';
import { Subcategory } from '../../src/modules/businesses/entities/subcategory.entity';

describe('Auth & Notifications (e2e)', () => {
  let app: INestApplication;
  let otpRepository: any;
  let categoryId: string;
  let subcategoryId: string;

  // Mock MailService
  const mockMailService = {
    sendOtp: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    console.log('[AuthE2E] Creating test application...');
    app = await createTestApp((builder) => {
      builder.overrideProvider(MailService).useValue(mockMailService);
    });

    console.log('[AuthE2E] Fetching Otp repository...');
    otpRepository = app.get(getRepositoryToken(Otp));

    // Seed a category and subcategory for testing
    console.log('[AuthE2E] Seeding categories and subcategories...');
    const dataSource = app.get(DataSource);
    const catRepo = dataSource.getRepository(Category);
    const subRepo = dataSource.getRepository(Subcategory);

    const cat = await catRepo.save(
      catRepo.create({ name: 'Test Category', description: 'Test' }),
    );
    const sub = await subRepo.save(
      subRepo.create({ name: 'Test Subcategory', categoryId: cat.id }),
    );
    categoryId = cat.id;
    subcategoryId = sub.id;
    console.log('[AuthE2E] Seeding completed.');
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
        password: 'Password123!',
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
        password: 'Password123!',
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
        password: 'Password123!',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
      });
  });

  it('/auth/login (POST) - phone number', async () => {
    const phone =
      '+1' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const testEmailPhone = `phone-test-${Date.now()}@example.com`;
    // Create a user with phone
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/send')
      .send({ email: testEmailPhone })
      .expect(201);

    const otpRecord = await otpRepository.findOne({
      where: { email: testEmailPhone },
      order: { createdAt: 'DESC' },
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ email: testEmailPhone, code: otpRecord.code })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Phone',
        lastName: 'Tester',
        email: testEmailPhone,
        password: 'Password123!',
        phone: phone,
      })
      .expect(201);

    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: phone,
        password: 'Password123!',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
      });
  });

  it('should allow resuming registration for PENDING users', async () => {
    const resumptionEmail = `resume-${Date.now()}@example.com`;
    const resumptionPhone =
      '+1' + Math.floor(1000000000 + Math.random() * 9000000000).toString();

    // 1. Request OTP
    await request(app.getHttpServer())
      .post('/api/v1/auth/register/owner/request-otp')
      .send({
        firstName: 'Resume',
        lastName: 'User',
        email: resumptionEmail,
        phone: resumptionPhone,
        role: 'Owner',
      })
      .expect(200);

    // 2. Verify OTP
    let otpRecord = await otpRepository.findOne({
      where: { email: resumptionEmail },
      order: { createdAt: 'DESC' },
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ email: resumptionEmail, code: otpRecord.code })
      .expect(200);

    // 3. Register user (without business details yet - account becomes PENDING)
    await request(app.getHttpServer())
      .post('/api/v1/auth/register/owner')
      .send({
        email: resumptionEmail,
        password: 'Password123!',
      })
      .expect(201);

    // 4. Request OTP again (resumption)
    await request(app.getHttpServer())
      .post('/api/v1/auth/register/owner/request-otp')
      .send({
        firstName: 'Resume',
        lastName: 'User',
        email: resumptionEmail,
        phone: resumptionPhone,
        role: 'Owner',
      })
      .expect(200);

    // 5. Verify new OTP
    otpRecord = await otpRepository.findOne({
      where: { email: resumptionEmail },
      order: { createdAt: 'DESC' },
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ email: resumptionEmail, code: otpRecord.code })
      .expect(200);

    // 6. Complete registration with business details
    await request(app.getHttpServer())
      .post('/api/v1/auth/register/owner')
      .send({
        email: resumptionEmail,
        password: 'Password123!',
        businessName: 'Resumed Business',
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        visitors: '100',
        goals: ['Resumption'],
        officialEmail: resumptionEmail,
        businessNumber: resumptionPhone,
        engagement: { linkedin: 'url' },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.user.status).toEqual('Active');
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
