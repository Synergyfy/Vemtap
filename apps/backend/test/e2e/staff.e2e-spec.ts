import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';
import { DataSource } from 'typeorm';
import { Business } from '../../src/modules/businesses/entities/business.entity';
import { Branch } from '../../src/modules/branches/entities/branch.entity';

describe('Staff Management (e2e)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let staffId: string;
  let branchId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const ownerRes = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = ownerRes.token;
    branchId = ownerRes.user.branchId;

    // Create a staff member for testing
    const staffRes = await createAuthenticatedUser(
      app,
      UserRole.STAFF,
      branchId,
    );
    staffId = staffRes.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Team Management', () => {
    it('/users/team/invite (POST) - should invite a new staff member', async () => {
      const email = `newstaff${Date.now()}@example.com`;
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/team/invite')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email,
          firstName: 'New',
          lastName: 'Staff',
          role: UserRole.STAFF,
          permissions: ['dashboard'],
        })
        .expect(201);

      expect(response.body.email).toBe(email);
      expect(response.body.status).toBe('Invited');
    });

    it('/users/team (GET) - should return team for owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/team?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('/users/team/:id (PATCH) - should allow owner to update staff', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/users/team/${staffId}?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ jobTitle: 'New Title' })
        .expect(200);
    });

    it('/users/team/:id (DELETE) - should allow owner to remove staff', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/users/team/${staffId}?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });
  });
});
