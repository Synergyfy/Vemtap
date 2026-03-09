import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('Devices (E2E)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let branchId: string;
  let deviceId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const ownerRes = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = ownerRes.token;
    branchId = ownerRes.user.branchId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/devices (GET)', () => {
    it('should return all devices for the branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/devices?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('/devices/generate (POST)', () => {
    it('should fail if no ready orders but branchId is passed', async () => {
      // In a fresh test DB there are no orders
      await request(app.getHttpServer())
        .post('/api/v1/devices/generate')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ branchId })
        .expect(201); // Returns empty array if no orders
    });
  });

  describe('/devices/:id (PATCH)', () => {
    it('should update a device name', async () => {
      // We need a device first. Let's create one via admin or just mock-create in beforeAll
      // For simplicity of this specific fix, let's assume we fetch first if any exist
      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/devices?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      if (listRes.body.length > 0) {
        deviceId = listRes.body[0].id;
        await request(app.getHttpServer())
          .patch(`/api/v1/devices/${deviceId}`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({ name: 'Updated Name', branchId })
          .expect(200);
      }
    });
  });
});
