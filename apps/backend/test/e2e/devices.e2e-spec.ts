import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { Device, DeviceStatus } from '../../src/modules/devices/entities/device.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Devices (E2E)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let branchId: string;
  let deviceId: string;
  let deviceRepo: Repository<Device>;

  beforeAll(async () => {
    app = await createTestApp();
    const ownerRes = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = ownerRes.token;
    branchId = ownerRes.user.branchId;
    
    deviceRepo = app.get(getRepositoryToken(Device));

    // Manually create a device for testing update and delete
    const device = await deviceRepo.save(
      deviceRepo.create({
        name: 'Initial Device',
        code: 'TEST-CODE-123',
        branchId: branchId,
        status: DeviceStatus.ACTIVE,
      } as any),
    );
    deviceId = device.id;
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
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].name).toBe('Initial Device');
    });
  });

  describe('/devices/stats (GET)', () => {
    it('should return device stats', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/devices/stats?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalDevices');
      expect(res.body).toHaveProperty('activeNow');
    });
  });

  describe('/devices/generate (POST)', () => {
    it('should return empty array if no ready orders but branchId is passed', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/devices/generate')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ branchId })
        .expect(201);
      
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('/devices/:id (PATCH)', () => {
    it('should update a device name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/devices/${deviceId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Updated Device Name', branchId })
        .expect(200);

      expect(res.body.name).toBe('Updated Device Name');
    });

    it('should fail if branchId is missing for Owner', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/devices/${deviceId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Another Name' })
        .expect(400);
    });
  });

  describe('/devices/:id (DELETE)', () => {
    it('should delete a device', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/devices/${deviceId}?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const deletedDevice = await deviceRepo.findOne({ where: { id: deviceId } });
      expect(deletedDevice).toBeNull();
    });
  });
});
