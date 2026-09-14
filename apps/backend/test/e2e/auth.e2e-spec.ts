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

  it('/auth/check-status (POST) - should return exists:true for existing user', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/check-status')
      .send({ identifier: testEmail })
      .expect(201)
      .expect((res) => {
        expect(res.body.exists).toBe(true);
        expect(res.body.role).toBe('Owner');
      });
  });

  it('/auth/check-status (POST) - should return exists:false for unknown', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/check-status')
      .send({ identifier: `nonexistent-${timestamp}@example.com` })
      .expect(201)
      .expect((res) => {
        expect(res.body.exists).toBe(false);
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

  it('Customer visitor signup flow: OTP → register → checkStatus', async () => {
    const visitorEmail = `visitor-${Date.now()}@example.com`;

    // 1. Send OTP
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/send')
      .send({ email: visitorEmail })
      .expect(201);

    // 2. Verify OTP
    const otpRecord = await otpRepository.findOne({
      where: { email: visitorEmail },
      order: { createdAt: 'DESC' },
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ email: visitorEmail, code: otpRecord.code })
      .expect(200);

    // 3. Register (customer - no businessName)
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Visitor',
        lastName: 'User',
        email: visitorEmail,
        password: 'Password123!',
      })
      .expect(201);
    expect(registerRes.body.access_token).toBeDefined();
    expect(registerRes.body.isNewUser).toBe(true);

    // 4. Check status should show new user
    const statusRes = await request(app.getHttpServer())
      .post('/api/v1/auth/check-status')
      .send({ identifier: visitorEmail })
      .expect(201);
    expect(statusRes.body.exists).toBe(true);
    expect(statusRes.body.role).toBe('Customer');
  });

  it('Customer flow: request OTP → verify & set 6-digit PIN → login with PIN → reset PIN', async () => {
    const customerEmail = `customer-${Date.now()}@example.com`;

    // 1. Request OTP with Full Name, Email, and Phone
    const reqOtpRes = await request(app.getHttpServer())
      .post('/api/v1/auth/customer/register/request-otp')
      .send({
        name: 'Sarah Connor',
        email: customerEmail,
        phone: '+2348099887766',
      })
      .expect(200);
    expect(reqOtpRes.body.message).toContain('OTP sent successfully');

    // 2. Locate OTP record in DB
    const otpRecord = await otpRepository.findOne({
      where: { email: customerEmail },
      order: { createdAt: 'DESC' },
    });
    expect(otpRecord).toBeDefined();
    expect(otpRecord.code).toHaveLength(6);

    // 3. Setting PIN with invalid OTP should fail
    await request(app.getHttpServer())
      .post('/api/v1/auth/customer/register/verify-and-set-pin')
      .send({
        email: customerEmail,
        code: '000000',
        pin: '123456',
      })
      .expect(400);

    // 4. Setting PIN with invalid PIN format (non-6 digits) should fail
    await request(app.getHttpServer())
      .post('/api/v1/auth/customer/register/verify-and-set-pin')
      .send({
        email: customerEmail,
        code: otpRecord.code,
        pin: '1234',
      })
      .expect(400);

    // 5. Successfully verify and set 6-digit PIN
    const verifyRes = await request(app.getHttpServer())
      .post('/api/v1/auth/customer/register/verify-and-set-pin')
      .send({
        email: customerEmail,
        code: otpRecord.code,
        pin: '123456',
      })
      .expect(201);
    expect(verifyRes.body.access_token).toBeDefined();
    expect(verifyRes.body.user.role).toBe('Customer');

    // 6. Log in with the 6-digit PIN
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: customerEmail,
        password: '123456',
      })
      .expect(200);
    expect(loginRes.body.access_token).toBeDefined();

    // 7. Request PIN Reset
    await request(app.getHttpServer())
      .post('/api/v1/auth/customer/pin/forgot')
      .send({ email: customerEmail })
      .expect(200);

    const resetOtp = await otpRepository.findOne({
      where: { email: customerEmail },
      order: { createdAt: 'DESC' },
    });
    expect(resetOtp).toBeDefined();

    // 8. Confirm Reset with new 6-digit PIN
    await request(app.getHttpServer())
      .post('/api/v1/auth/customer/pin/reset')
      .send({
        email: customerEmail,
        otp: resetOtp.code,
        newPin: '654321',
      })
      .expect(200);

    // 9. Log in with new 6-digit PIN
    const newLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: customerEmail,
        password: '654321',
      })
      .expect(200);
    expect(newLoginRes.body.access_token).toBeDefined();
  });

  it('Customer unverified login should trigger OTP and require PIN setup', async () => {
    const unverifiedEmail = `unverified-${Date.now()}@example.com`;

    // Create a pending customer with no password
    const userRepo = app.get('UserRepository');
    const user = userRepo.create({
      email: unverifiedEmail,
      firstName: 'Unverified',
      lastName: 'Customer',
      role: 'Customer',
      status: 'Pending',
      emailVerified: false,
      password: null,
    });
    await userRepo.save(user);

    // Attempting login sends OTP and returns requiresPinSetup
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: unverifiedEmail,
        password: 'any_password',
      })
      .expect(200);

    expect(loginRes.body.requiresPinSetup).toBe(true);
    expect(loginRes.body.email).toBe(unverifiedEmail);

    // Verify OTP was stored in DB
    const otp = await otpRepository.findOne({
      where: { email: unverifiedEmail },
      order: { createdAt: 'DESC' },
    });
    expect(otp).toBeDefined();
  });

  it('Customer completeCustomerSetup: should update email for dummy-email user', async () => {
    const dummyEmail = `dummy-${Date.now()}@vemtap.dummy`;
    const realEmail = `real-${Date.now()}@example.com`;

    // Register with dummy email
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/send')
      .send({ email: dummyEmail })
      .expect(201);

    const otpRecord = await otpRepository.findOne({
      where: { email: dummyEmail },
      order: { createdAt: 'DESC' },
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ email: dummyEmail, code: otpRecord.code })
      .expect(200);

    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Dummy',
        lastName: 'User',
        email: dummyEmail,
        password: 'Password123!',
      })
      .expect(201);
    const token = registerRes.body.access_token;

    // Complete setup: update to real email
    await request(app.getHttpServer())
      .post('/api/v1/auth/customer/complete-setup')
      .send({ identifier: dummyEmail, email: realEmail })
      .expect(201);

    // Login with new email
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: realEmail, password: 'Password123!' })
      .expect(200);
    expect(loginRes.body.access_token).toBeDefined();
  });

  it('Full owner registration flow: OTP → registerOwner (all details) → login → checkStatus', async () => {
    const ownerEmail = `fullowner-${Date.now()}@example.com`;
    const ownerPhone =
      '+1' + Math.floor(1000000000 + Math.random() * 9000000000).toString();

    // 1. Request Owner OTP
    await request(app.getHttpServer())
      .post('/api/v1/auth/register/owner/request-otp')
      .send({
        firstName: 'Full',
        lastName: 'Owner',
        email: ownerEmail,
        phone: ownerPhone,
        role: 'Owner',
      })
      .expect(200);

    // 2. Verify OTP
    const otpRecord = await otpRepository.findOne({
      where: { email: ownerEmail },
      order: { createdAt: 'DESC' },
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ email: ownerEmail, code: otpRecord.code })
      .expect(200);

    // 3. Register Owner with all details
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register/owner')
      .send({
        email: ownerEmail,
        password: 'OwnerPass123!',
        firstName: 'Full',
        lastName: 'Owner',
        businessName: 'Full Owner Business',
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        visitors: '250',
        goals: ['Sales', 'Branding'],
        officialEmail: ownerEmail,
        businessNumber: ownerPhone,
        businessAddress: '123 Main St',
        businessWebsite: 'https://fullowner.com',
        whatsappNumber: ownerPhone,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.user.email).toEqual(ownerEmail);
        expect(res.body.user.status).toEqual('Active');
        expect(res.body.user.role).toEqual('Owner');
        expect(res.body.access_token).toBeDefined();
        expect(res.body.isNewUser).toBe(true);
      });

    // 4. Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: ownerEmail,
        password: 'OwnerPass123!',
      })
      .expect(200);
    expect(loginRes.body.access_token).toBeDefined();

    // 5. Check status
    const statusRes = await request(app.getHttpServer())
      .post('/api/v1/auth/check-status')
      .send({ identifier: ownerEmail })
      .expect(201);
    expect(statusRes.body.exists).toBe(true);
    expect(statusRes.body.role).toBe('Owner');
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
