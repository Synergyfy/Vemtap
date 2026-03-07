import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('Visitors (E2E)', () => {
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

  describe('GET /api/v1/visitors/stats', () => {
    it('should return visitor stats for the branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/visitors/stats?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('stats');
    });

    it('should return visitor stats for all branches', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/visitors/stats?allBranches=true`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('stats');
    });
  });

  describe('GET /api/v1/visitors', () => {
    it('should return all visitors for the branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/visitors?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
