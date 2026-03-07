import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('Businesses (E2E)', () => {
  let app: INestApplication;
  let server: any;
  let ownerToken: string;
  let businessId: string;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    // Helper now handles business and main branch creation automatically for OWNER
    const { token, user } = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = token;
    businessId = user.businessId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PATCH /api/v1/businesses/my-business', () => {
    it('should update business name', async () => {
      const updateDto = {
        name: 'Updated E2E Business Name',
      };

      const res = await request(server)
        .patch('/api/v1/businesses/my-business')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateDto)
        .expect(200);

      const body = res.body as Record<string, any>;
      expect(body.name).toBe(updateDto.name);
    });
  });

  describe('GET /api/v1/businesses/my-business', () => {
    it('should return business details', async () => {
      const res = await request(server)
        .get('/api/v1/businesses/my-business')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const body = res.body as Record<string, any>;
      expect(body.id).toBe(businessId);
      expect(body.name).toBeDefined();
    });
  });
});
