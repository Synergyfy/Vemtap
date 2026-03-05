import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  User,
  UserRole,
  UserStatus,
} from '../../src/modules/users/entities/user.entity';
import {
  Business,
  BusinessType,
} from '../../src/modules/businesses/entities/business.entity';
import { Branch } from '../../src/modules/branches/entities/branch.entity';
import { Contact } from '../../src/modules/contacts/entities/contact.entity';
import { AuthService } from '../../src/modules/auth/auth.service';
import { Channel } from '../../src/modules/messaging/enums/channel.enum';
import { Plan } from '../../src/modules/subscriptions/entities/plan.entity';
import {
  Subscription,
  SubscriptionStatus,
  BillingPeriod,
} from '../../src/modules/subscriptions/entities/subscription.entity';
import { TermiiProvider } from '../../src/modules/messaging/providers/termii.provider';
import * as bcrypt from 'bcrypt';

describe('Messaging (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let businessRepo: Repository<Business>;
  let branchRepo: Repository<Branch>;
  let contactRepo: Repository<Contact>;
  let planRepo: Repository<Plan>;
  let subRepo: Repository<Subscription>;
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
    });

    userRepo = app.get(getRepositoryToken(User));
    businessRepo = app.get(getRepositoryToken(Business));
    branchRepo = app.get(getRepositoryToken(Branch));
    contactRepo = app.get(getRepositoryToken(Contact));
    planRepo = app.get(getRepositoryToken(Plan));
    subRepo = app.get(getRepositoryToken(Subscription));
    authService = app.get(AuthService);

    const testId = Date.now().toString();
    const password = 'password123';
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
        type: BusinessType.RETAIL,
        ownerId: owner.id,
        balance: 100, // Give some top-up balance too
      } as any),
    )) as unknown as Business;
    businessId = business.id;

    owner.businessId = businessId;
    await userRepo.save(owner);

    // 2. Create Plan & Subscription (Required by TrialRestrictionGuard)
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
    const branch = await branchRepo.save(
      branchRepo.create({
        name: 'Main Branch',
        businessId: businessId,
        isActive: true,
      }),
    );
    branchId = branch.id;

    // 4. Create Contacts
    await contactRepo.save([
      contactRepo.create({
        businessId,
        name: 'Contact 1',
        phone: '+1234567890',
        optOut: false,
        optInChannels: [Channel.SMS, Channel.WHATSAPP, Channel.EMAIL],
      }),
      contactRepo.create({
        businessId,
        name: 'Contact 2',
        phone: '+0987654321',
        optOut: false,
        optInChannels: [Channel.SMS, Channel.WHATSAPP, Channel.EMAIL],
      }),
    ]);

    const loginResult = await authService.login({
      identifier: owner.email,
      password: password,
    });
    ownerToken = loginResult.access_token;
  });

  afterAll(async () => {
    // Cleanup
    if (businessId) {
      await contactRepo.delete({ businessId });
      await branchRepo.delete({ businessId });
      await subRepo.delete({ businessId });
      await userRepo.delete({ businessId });
      await businessRepo.delete({ id: businessId });
    }
    await app.close();
  });

  describe('POST /messaging/send', () => {
    it('should send a campaign to ALL contacts without branchId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/messaging/send')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          channel: Channel.SMS,
          audienceType: 'ALL',
          content: 'Hello all!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('campaignId');
    });

    it('should send a message to a specific contact', async () => {
      const contacts = await contactRepo.find({ where: { businessId } });
      const res = await request(app.getHttpServer())
        .post('/api/v1/messaging/send')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          channel: Channel.SMS,
          contactIds: [contacts[0].id],
          content: 'Hello individual!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('messageIds');
      expect(res.body.messageIds).toHaveLength(1);
    });

    it('should fail with invalid audienceType', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/messaging/send')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          channel: Channel.SMS,
          audienceType: 'INVALID_TYPE',
          content: 'test',
        })
        .expect(400);
    });
  });

  describe('GET /messaging/campaigns', () => {
    it('should return campaigns for the business', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/messaging/campaigns')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });
});
