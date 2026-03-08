import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../../src/modules/users/entities/user.entity';
import { AutomationRule } from '../../src/modules/messaging/entities/automation-rule.entity';
import { AutomationLog } from '../../src/modules/messaging/entities/automation-log.entity';
import {
  TriggerType,
  ActionType,
} from '../../src/modules/messaging/enums/automation.enum';

describe('AutomationsController (e2e)', () => {
  let app: INestApplication;
  let ruleRepo: Repository<AutomationRule>;
  let logRepo: Repository<AutomationLog>;

  let ownerToken: string;
  let branchId: string;
  let ruleId: string;

  beforeAll(async () => {
    app = await createTestApp();

    const { token, user } = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = token;
    branchId = user.branchId;

    ruleRepo = app.get(getRepositoryToken(AutomationRule));
    logRepo = app.get(getRepositoryToken(AutomationLog));

    // 2. Create an Automation Rule
    const rule = ruleRepo.create({
      branchId: branchId,
      businessId: user.businessId,
      name: 'Test Welcome Automation',
      triggerType: TriggerType.FIRST_TAG,
      actionType: ActionType.SEND_WHATSAPP,
      isActive: false,
      delaySeconds: 0,
      actionConfig: {
        content: 'Welcome {{visitor_name}}!',
        loyaltyPoints: 0,
      },
    } as any);
    const savedRule = await ruleRepo.save(rule);
    ruleId = savedRule.id;

    // 3. Create a Log entry for this rule
    await logRepo.save(
      logRepo.create({
        ruleId: savedRule.id,
        branchId: branchId,
        businessId: user.businessId,
        contactId: 'contact-uuid',
        status: 'success',
        errorReason: undefined,
      } as any),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Business Dashboard E2E', () => {
    it('GET /messaging/automations - should return a list of rules', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/messaging/automations?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /messaging/automations/:id/toggle - should toggle automation active status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/messaging/automations/${ruleId}/toggle`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ isActive: true, branchId: branchId }) // Correctly pass branchId in Body
        .expect(200);

      expect(res.body.isActive).toBe(true);
    });

    it('PATCH /messaging/automations/:id/configure - should save valid configurations', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/messaging/automations/${ruleId}/configure`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          content:
            'Hello {{visitor_name}}, thanks for visiting {{business_name}}!',
          loyaltyPoints: 50,
          branchId: branchId, // Correctly pass branchId in Body
        })
        .expect(200);

      expect(res.body.actionConfig.content).toContain('{{business_name}}');
    });

    it('GET /messaging/automations/logs - should return logs for the branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/messaging/automations/logs?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('GET /messaging/automations/performance - should return stats', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/messaging/automations/performance?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.totalMessagesSent).toBeGreaterThanOrEqual(1);
    });

    it('GET /messaging/automations/connection-status - should return whatsapp connection status', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/messaging/automations/connection-status?branchId=${branchId}`,
        )
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.status).toBe('Connected');
    });
  });
});
