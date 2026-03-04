import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';
import { FlowTriggerConfig } from '../../src/modules/messaging/entities/flow-trigger-config.entity';
import { FlowAnalyticsResponse } from '../../src/modules/messaging/interfaces/flow-engine.interface';
import { Setting } from '../../src/modules/settings/entities/setting.entity';

describe('Admin Flow Engine (E2E)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const admin = await createAuthenticatedUser(app, UserRole.ADMIN);
    adminToken = admin.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/admin/flow-engine/templates (GET)', () => {
    it('should return 200 for admins', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/flow-engine/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should return 403 for non-admins', async () => {
      const customer = await createAuthenticatedUser(app, UserRole.CUSTOMER);
      return request(app.getHttpServer())
        .get('/api/v1/admin/flow-engine/templates')
        .set('Authorization', `Bearer ${customer.token}`)
        .expect(403);
    });
  });

  describe('/admin/flow-engine/triggers (GET)', () => {
    it('should return 200 and seed default triggers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/flow-engine/triggers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('/admin/flow-engine/analytics (GET)', () => {
    it('should return 200 with analytics object', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/flow-engine/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalMessagesSent');
      expect(res.body).toHaveProperty('activeSessionsCount');
    });
  });

  describe('/admin/flow-engine/settings (GET)', () => {
    it('should return 200 and settings object', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/flow-engine/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('platformName');
    });
  });
});
