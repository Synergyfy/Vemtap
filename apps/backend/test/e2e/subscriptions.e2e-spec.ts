import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';
import { DataSource } from 'typeorm';
import { Business } from '../../src/modules/businesses/entities/business.entity';
import { Branch } from '../../src/modules/branches/entities/branch.entity';
import { Plan } from '../../src/modules/subscriptions/entities/plan.entity';
import {
  Subscription,
  SubscriptionStatus,
  BillingPeriod,
} from '../../src/modules/subscriptions/entities/subscription.entity';

describe('Subscriptions & Trial System (e2e)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let businessId: string;
  let planId: string;

  const mockHttpService = {
    post: jest.fn().mockReturnValue(require('rxjs').of({ data: { status: 'success' } })),
    get: jest.fn(),
  };

  beforeAll(async () => {
    app = await createTestApp((builder) => {
      builder.overrideProvider(require('@nestjs/axios').HttpService).useValue(mockHttpService);
    });
    // Helper now creates business and main branch automatically for OWNER
    const { token, user } = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = token;
    businessId = user.businessId;

    const dataSource = app.get(DataSource);
    const planRepo = dataSource.getRepository(Plan);

    // 2. Setup Plan
    const plan = await planRepo.save(
      planRepo.create({
        name: 'Pro Plan',
        messagingEnabled: true,
        analyticsEnabled: true,
        teamMembersEnabled: true,
        branchesEnabled: true,
        smsCredits: 100,
        whatsappCredits: 100,
        emailCredits: 100,
        isActive: true,
        monthlyPrice: 50,
        qrThrivePlanId: 'qr-plan-xyz', // Link to QR-Thrive
      }),
    );
    planId = plan.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Subscription & Trial Flow', () => {
    it('/subscriptions/subscribe (POST) - should create a subscription and sync with QR-Thrive', async () => {
      // First, we need to ensure the user is synced with QR-Thrive
      // Alternatively, we can just mock the user mapping in the test database
      const dataSource = app.get(DataSource);
      const userRepo = dataSource.getRepository(require('../../src/modules/users/entities/user.entity').User);
      const user = await userRepo.findOne({ where: { role: require('../../src/modules/users/entities/user.entity').UserRole.OWNER } });
      if (!user) throw new Error('Test owner user not found');
      
      const userMappingRepo = dataSource.getRepository(require('../../src/modules/qr-thrive/entities/qr-thrive-user-mapping.entity').QrThriveUserMapping);
      await userMappingRepo.save(userMappingRepo.create({ userId: user.id, qrThriveUserId: 'qr-u-123' }));

      await request(app.getHttpServer())
        .post('/api/v1/subscriptions/subscribe')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          planId: planId,
          billingPeriod: BillingPeriod.MONTHLY,
          paymentReference: 'test-ref-123',
        })
        .expect(201);

      // Verify side effect: HttpService.post was called to sync subscription
      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/integration/users/qr-u-123/subscription'),
        { planId: 'qr-plan-xyz' },
        expect.any(Object)
      );
    });

    it('/subscriptions/active (GET) - should return active subscription', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/subscriptions/active')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('/subscriptions/capabilities (GET) - should return plan capabilities', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/subscriptions/capabilities')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.plan).toBe('Pro Plan');
    });
  });
});
