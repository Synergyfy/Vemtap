import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Plan } from '../../src/modules/subscriptions/entities/plan.entity';
import { Subscription, SubscriptionStatus, BillingPeriod } from '../../src/modules/subscriptions/entities/subscription.entity';
import { UserRole, User } from '../../src/modules/users/entities/user.entity';
import { Business } from '../../src/modules/businesses/entities/business.entity';
import { PaymentsService } from '../../src/modules/payments/payments.service';
import { DataSource } from 'typeorm';

describe('Subscriptions & Trial System (e2e)', () => {
  let app: INestApplication;
  let planRepository: any;
  let subscriptionRepository: any;
  let businessRepository: any;
  let userRepository: any;

  const FREE_PLAN_ID = '00000000-0000-0000-0000-000000000001';
  const PRO_PLAN_ID = '00000000-0000-0000-0000-000000000002';

  const mockPaymentsService = {
    verifyTransaction: jest.fn().mockResolvedValue({
      status: 'success',
      authorization: { authorization_code: 'AUTH_123456' },
    }),
    recordPayment: jest.fn().mockResolvedValue({ id: '00000000-0000-0000-0000-000000000003' }),
  };

  beforeAll(async () => {
    app = await createTestApp((builder) => {
      builder.overrideProvider(PaymentsService).useValue(mockPaymentsService);
    });

    planRepository = app.get(getRepositoryToken(Plan));
    subscriptionRepository = app.get(getRepositoryToken(Subscription));
    businessRepository = app.get(getRepositoryToken(Business));
    userRepository = app.get(getRepositoryToken(User));

    // Seed basic plans
    await planRepository.save([
      {
        id: FREE_PLAN_ID,
        name: 'Free Plan',
        isFree: true,
        isActive: true,
        monthlyPrice: 0,
        trialDurationDays: 0,
        teamMembersLimit: 2,
      },
      {
        id: PRO_PLAN_ID,
        name: 'Pro Plan',
        isFree: false,
        isActive: true,
        monthlyPrice: 5000,
        trialDurationDays: 14,
        teamMembersLimit: 10,
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Plans', () => {
    it('/plans (GET) - should list all active plans', () => {
      return request(app.getHttpServer())
        .get('/api/v1/plans?onlyActive=true')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
          expect(res.body.find(p => p.name === 'Free Plan')).toBeDefined();
        });
    });
  });

  describe('Subscription & Trial Flow', () => {
    let ownerToken: string;
    let businessId: string;
    let ownerId: string;

    beforeAll(async () => {
      const auth = await createAuthenticatedUser(app, UserRole.OWNER);
      ownerToken = auth.token;
      ownerId = auth.user.id;

      // Manually create a business and link it to the owner
      const business = businessRepository.create({
        name: 'Test Business',
        ownerId: ownerId,
      });
      const savedBusiness = await businessRepository.save(business);
      businessId = savedBusiness.id;

      // Update owner with businessId
      await userRepository.update(ownerId, { businessId });
    });

    it('/subscriptions/subscribe (POST) - should start a trial for Pro plan', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/subscriptions/subscribe')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          planId: PRO_PLAN_ID,
          businessId: businessId,
          billingPeriod: BillingPeriod.MONTHLY,
          isTrial: true,
        })
        .expect(201);

      expect(response.body.status).toBe(SubscriptionStatus.TRIAL);
      expect(response.body.planId).toBe(PRO_PLAN_ID);
      expect(response.body.trialEndDate).toBeDefined();
    });

    it('/subscriptions/active/:businessId (GET) - should return the active trial subscription', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/subscriptions/active/${businessId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.status).toBe(SubscriptionStatus.TRIAL);
      expect(response.body.plan.name).toBe('Pro Plan');
    });

    it('/subscriptions/capabilities/:businessId (GET) - should return plan capabilities', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/subscriptions/capabilities/${businessId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.plan).toBe('Pro Plan');
      expect(response.body.isTrial).toBe(true);
      expect(response.body.capabilities.teamMembers.limit).toBe(10);
    });

    it('/subscriptions/subscribe (POST) - should allow direct paid subscription (skipping trial)', async () => {
        mockPaymentsService.verifyTransaction.mockResolvedValueOnce({
            status: 'success',
            authorization: { authorization_code: 'AUTH_PAID_789' }
        });

        const response = await request(app.getHttpServer())
          .post('/api/v1/subscriptions/subscribe')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            planId: PRO_PLAN_ID,
            businessId: businessId,
            billingPeriod: BillingPeriod.MONTHLY,
            paymentReference: 'REF_PAID_123',
            isTrial: false,
          })
          .expect(201);
  
        expect(response.body.status).toBe(SubscriptionStatus.ACTIVE);
        expect(response.body.paystackAuthorizationCode).toBe('AUTH_PAID_789');
        expect(response.body.trialEndDate).toBeNull();
      });
  });

  describe('Permissions & Guarding', () => {
    it('/subscriptions/subscribe (POST) - should forbid CUSTOMER from subscribing', async () => {
      const { token } = await createAuthenticatedUser(app, UserRole.CUSTOMER);
      
      return request(app.getHttpServer())
        .post('/api/v1/subscriptions/subscribe')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId: PRO_PLAN_ID,
          businessId: '00000000-0000-0000-0000-000000000004',
          billingPeriod: BillingPeriod.MONTHLY,
          isTrial: true,
        })
        .expect(403);
    });
  });
});
