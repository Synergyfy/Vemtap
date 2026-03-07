import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('Campaigns (E2E)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let branchId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const ownerRes = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = ownerRes.token;
    branchId = ownerRes.user.branchId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/campaigns', () => {
    it('should return campaigns for the branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/campaigns?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/v1/campaigns/stats', () => {
    it('should return campaign stats for the branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/campaigns/stats?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
