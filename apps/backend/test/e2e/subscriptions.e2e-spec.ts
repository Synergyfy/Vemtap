import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';
import { DataSource } from 'typeorm';
import { Business } from '../../src/modules/businesses/entities/business.entity';
import { Branch } from '../../src/modules/branches/entities/branch.entity';
import { Plan } from '../../src/modules/subscriptions/entities/plan.entity';
import { Subscription, SubscriptionStatus, BillingPeriod } from '../../src/modules/subscriptions/entities/subscription.entity';

describe('Subscriptions & Trial System (e2e)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let businessId: string;
  let planId: string;

  beforeAll(async () => {
    app = await createTestApp();
    // Helper now creates business and main branch automatically for OWNER
    const { token, user } = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = token;
    businessId = user.businessId;

    const dataSource = app.get(DataSource);
    const planRepo = dataSource.getRepository(Plan);

    // 2. Setup Plan
    const plan = await planRepo.save(planRepo.create({
      name: 'Pro Plan',
      smsCredits: 100,
      whatsappCredits: 100,
      emailCredits: 100,
      isActive: true,
      monthlyPrice: 50
    }));
    planId = plan.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Subscription & Trial Flow', () => {
    it('/subscriptions/subscribe (POST) - should create a subscription', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/subscriptions/subscribe')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          planId: planId,
          billingPeriod: BillingPeriod.MONTHLY,
          paymentReference: 'test-ref-123'
        })
        .expect(201);
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
