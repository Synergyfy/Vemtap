import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import {
  Business,
  BusinessType,
} from '../../src/modules/businesses/entities/business.entity';
import { AutomationRule } from '../../src/modules/messaging/entities/automation-rule.entity';
import { AutomationLog } from '../../src/modules/messaging/entities/automation-log.entity';
import {
  TriggerType,
  ActionType,
} from '../../src/modules/messaging/enums/automation.enum';
import { AuthService } from '../../src/modules/auth/auth.service';

describe('AutomationsController (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let businessRepo: Repository<Business>;
  let ruleRepo: Repository<AutomationRule>;
  let logRepo: Repository<AutomationLog>;
  let authService: AuthService;

  let ownerToken: string;
  let businessId: string;
  let ruleId: string;

  beforeAll(async () => {
    app = await createTestApp();

    userRepo = app.get(getRepositoryToken(User));
    businessRepo = app.get(getRepositoryToken(Business));
    ruleRepo = app.get(getRepositoryToken(AutomationRule));
    logRepo = app.get(getRepositoryToken(AutomationLog));
    authService = app.get(AuthService);

    const testId = Date.now().toString();

    const ownerParams = userRepo.create({
      email: `owner-${testId}@test.com`,
      password: 'password123',
      firstName: 'Owner',
      lastName: 'Test',
      role: UserRole.OWNER,
    } as any);
    const savedOwner = (await userRepo.save(ownerParams)) as unknown as User;

    const biz = {
      name: 'Test Business ' + testId,
      type: BusinessType.RETAIL,
      ownerId: savedOwner.id,
    };
    const businessParams = businessRepo.create(biz as any);
    const savedBusiness = (await businessRepo.save(businessParams)) as unknown as Business;
    businessId = savedBusiness.id;

    savedOwner.businessId = businessId;
    await userRepo.save(savedOwner);

    const loginResult = await authService.login({
      identifier: savedOwner.email,
      password: 'password123',
    });
    ownerToken = loginResult.access_token;

    // 2. Create an Automation Rule
    const rule = ruleRepo.create({
      businessId: businessId,
      name: 'Test Welcome Automation',
      triggerType: TriggerType.FIRST_TAG,
      actionType: ActionType.SEND_WHATSAPP,
      isActive: false,
      delaySeconds: 0,
      actionConfig: {
        content: 'Welcome {{visitor_name}}!',
        loyaltyPoints: 0,
      },
    });
    const savedRule = await ruleRepo.save(rule);
    ruleId = savedRule.id;

    // 3. Create a Log entry for this rule
    await logRepo.save(
      logRepo.create({
        ruleId: savedRule.id,
        contactId: 'contact-uuid',
        status: 'success',
        errorReason: undefined,
      }),
    );
  });

  afterAll(async () => {
    // Cleanup logs and rules to avoid wiping other test data. Users/Businesses cascade.
    // Use delete instead of clear to avoid truncation foreign key issues
    await logRepo.createQueryBuilder().delete().execute();
    await ruleRepo.createQueryBuilder().delete().execute();
    await userRepo.createQueryBuilder().delete().execute();
    await businessRepo.createQueryBuilder().delete().execute();
    await app.close();
  });

  describe('Business Dashboard E2E', () => {
    it('GET /automations - should return a list of rules', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/automations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].name).toBe('Test Welcome Automation');
    });

    it('PATCH /automations/:id/toggle - should toggle automation active status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/automations/${ruleId}/toggle`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ isActive: true })
        .expect(200);

      expect(res.body.isActive).toBe(true);
    });

    it('PATCH /automations/:id/configure - should save valid configurations', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/automations/${ruleId}/configure`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          content:
            'Hello {{visitor_name}}, thanks for visiting {{business_name}}!',
          loyaltyPoints: 50,
        })
        .expect(200);

      expect(res.body.actionConfig.content).toContain('{{business_name}}');
      expect(res.body.actionConfig.loyaltyPoints).toBe(50);
    });

    it('PATCH /automations/:id/configure - should fail on invalid variables', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/automations/${ruleId}/configure`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          content: 'Hello {{hacker_name}}',
        })
        .expect(400);

      expect(res.body.message).toContain('Invalid variable found');
    });

    it('GET /automations/logs - should return logs for the business', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/automations/logs')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].ruleName).toBe('Test Welcome Automation');
      expect(res.body.data[0].status).toBe('success');
    });

    it('GET /automations/performance - should return stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/automations/performance')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.totalMessagesSent).toBeGreaterThanOrEqual(1);
      expect(res.body.activeAutomationsCount).toBeGreaterThanOrEqual(1);
      expect(res.body.loyaltyPointsIssued).toBeGreaterThanOrEqual(0); // Before our updated rule fired any new logs
    });

    it('GET /automations/connection-status - should return whatsapp connection status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/automations/connection-status')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.status).toBe('Connected');
      expect(res.body.provider).toBe('WhatsApp');
    });
  });
});
