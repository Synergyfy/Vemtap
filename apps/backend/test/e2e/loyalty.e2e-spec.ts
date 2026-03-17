import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('Loyalty (E2E)', () => {
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

  describe('GET /api/v1/loyalty/business-stats', () => {
    it('should return loyalty stats for the branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/loyalty/business-stats?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('stats');
      expect(Array.isArray(res.body.stats)).toBe(true);
      expect(res.body.stats.find((s: any) => s.label === 'Total Members')).toBeDefined();
    });

    it('should return loyalty stats for all branches', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/loyalty/business-stats?allBranches=true`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('stats');
    });
  });
});
