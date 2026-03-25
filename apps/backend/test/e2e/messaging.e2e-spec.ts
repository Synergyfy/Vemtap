import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  User,
  UserRole,
  UserStatus,
} from '../../src/modules/users/entities/user.entity';
import { Business } from '../../src/modules/businesses/entities/business.entity';
import { Branch } from '../../src/modules/branches/entities/branch.entity';
import { Visit } from '../../src/modules/visitors/entities/visit.entity';
import { AuthService } from '../../src/modules/auth/auth.service';
import { Channel } from '../../src/modules/messaging/enums/channel.enum';
import { Plan } from '../../src/modules/subscriptions/entities/plan.entity';
import {
  BillingPeriod,
  Subscription,
  SubscriptionStatus,
} from '../../src/modules/subscriptions/entities/subscription.entity';
import { BusinessCreditWallet } from '../../src/modules/messaging/entities/business-credit-wallet.entity';
import { TermiiProvider } from '../../src/modules/messaging/providers/termii.provider';
import { BestBulkSmsProvider } from '../../src/modules/messaging/providers/bestbulksms.provider';
import * as bcrypt from 'bcrypt';

describe('Messaging (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let businessRepo: Repository<Business>;
  let branchRepo: Repository<Branch>;
  let visitRepo: Repository<Visit>;
  let planRepo: Repository<Plan>;
  let subRepo: Repository<Subscription>;
  let walletRepo: Repository<BusinessCreditWallet>;
  let authService: AuthService;

  let ownerToken: string;
  let businessId: string;
  let branchId: string;

  beforeAll(async () => {
    app = await createTestApp((builder) => {
      builder.overrideProvider(TermiiProvider).useValue({
        sendMessage: jest.fn().mockResolvedValue({
          messageId: 'test-msg-id',
          status: 'sent',
        }),
        estimateCost: jest.fn().mockReturnValue(0.05),
      });
      builder.overrideProvider(BestBulkSmsProvider).useValue({
        sendMessage: jest.fn().mockResolvedValue({
          messageId: 'test-sms-id',
          status: 'sent',
        }),
        estimateCost: jest.fn().mockReturnValue(0.05),
      });
    });

    userRepo = app.get(getRepositoryToken(User));
    businessRepo = app.get(getRepositoryToken(Business));
    branchRepo = app.get(getRepositoryToken(Branch));
    visitRepo = app.get(getRepositoryToken(Visit));
    planRepo = app.get(getRepositoryToken(Plan));
    subRepo = app.get(getRepositoryToken(Subscription));
    walletRepo = app.get(getRepositoryToken(BusinessCreditWallet));
    authService = app.get(AuthService);

    const testId =
      Date.now().toString() + Math.random().toString(36).substring(7);
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Owner & Business
    const owner = (await userRepo.save(
      userRepo.create({
        email: `owner-msg-${testId}@test.com`,
        password: hashedPassword,
        firstName: 'Owner',
        lastName: 'Test',
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
      } as any),
    )) as unknown as User;

    const business = (await businessRepo.save(
      businessRepo.create({
        name: 'Msg Test Biz',
        ownerId: owner.id,
      } as any),
    )) as unknown as Business;
    businessId = business.id;

    owner.businessId = businessId;
    await userRepo.save(owner);

    // 2. Create Plan & Subscription
    const plan = await planRepo.save(
      planRepo.create({
        name: 'Test Plan',
        smsCredits: 1000,
        whatsappCredits: 1000,
        emailCredits: 1000,
        isActive: true,
      }),
    );

    await subRepo.save(
      subRepo.create({
        businessId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        billingPeriod: BillingPeriod.MONTHLY,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }),
    );

    // 3. Create Branch
    const branch = (await branchRepo.save(
      branchRepo.create({
        name: 'Main Branch',
        businessId: businessId,
        isActive: true,
      } as any),
    )) as any;
    branchId = branch.id;

    // 3.5 Create Wallet with Credits
    await walletRepo.save(
      walletRepo.create({
        businessId,
        smsCredits: 1000,
        whatsappCredits: 1000,
        emailCredits: 1000,
      }),
    );

    // 4. Create Customers and Visits
    const customer1 = (await userRepo.save(
      userRepo.create({
        email: `cust1-${testId}@test.com`,
        password: hashedPassword,
        firstName: 'Customer',
        lastName: 'One',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        phone: `+123${Math.floor(Math.random() * 10000000)}`,
      } as any),
    )) as any;

    const customer2 = (await userRepo.save(
      userRepo.create({
        email: `cust2-${testId}@test.com`,
        password: hashedPassword,
        firstName: 'Customer',
        lastName: 'Two',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        phone: `+098${Math.floor(Math.random() * 10000000)}`,
      } as any),
    )) as any;

    await visitRepo.save([
      visitRepo.create({
        customerId: customer1.id,
        branchId,
        businessId,
      } as any) as any,
      visitRepo.create({
        customerId: customer2.id,
        branchId,
        businessId,
      } as any) as any,
    ]);

    const loginResult = await authService.login({
      identifier: owner.email,
      password: password,
    });
    ownerToken = loginResult.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/messaging/send', () => {
    it('should send a campaign to ALL customers with branchId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/messaging/send')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          channel: Channel.SMS,
          audienceType: 'ALL',
          content: 'Hello all!',
          branchId: branchId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('campaignId');
    });

    it('should send a message to a specific customer with branchId', async () => {
      const customers = await userRepo.find({
        where: { role: UserRole.CUSTOMER },
      });
      const res = await request(app.getHttpServer())
        .post('/api/v1/messaging/send')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          channel: Channel.SMS,
          customerIds: [customers[0].id],
          content: 'Hello individual!',
          branchId: branchId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('messageIds');
    });

    it('should fail if branchId is missing for Owner', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/messaging/send')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          channel: Channel.SMS,
          audienceType: 'ALL',
          content: 'test',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/messaging/campaigns', () => {
    it('should return campaigns for a specific branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/messaging/campaigns?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
    });

    it('should return campaigns for the whole business with allBranches=true', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/messaging/campaigns?allBranches=true&branchId=${branchId}`,
        ) // Must provide ONE branch context even for aggregation for access check
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
    });
  });
});
