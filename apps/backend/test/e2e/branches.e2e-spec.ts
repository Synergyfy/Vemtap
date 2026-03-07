import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';
import { DataSource } from 'typeorm';
import { Business } from '../../src/modules/businesses/entities/business.entity';
import { Branch } from '../../src/modules/branches/entities/branch.entity';

describe('Branches (E2E)', () => {
  let app: INestApplication;
  let server: any;
  let ownerToken: string;
  let branchId: string;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    const { token, user } = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = token;

    const dataSource = app.get(DataSource);
    const businessRepo = dataSource.getRepository(Business);
    const branchRepo = dataSource.getRepository(Branch);

    // Create business and main branch
    const business = await businessRepo.save(
      businessRepo.create({
        name: 'Branch Test Business',
        ownerId: user.id,
      }),
    );

    const branch = await branchRepo.save(
      branchRepo.create({
        name: 'Main Branch',
        businessId: business.id,
        isMainBranch: true,
      }),
    );
    branchId = branch.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PATCH /api/v1/branches/:id', () => {
    it('should update branch about and hours', async () => {
      const updateDto = {
        about: 'Detailed about for this branch.',
        businessHours: {
          monday: { open: '09:00', close: '17:00' },
          saturday: { closed: true },
        },
        welcomeMessage: 'Welcome to our main branch!',
      };

      const res = await request(server)
        .patch(`/api/v1/branches/${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateDto)
        .expect(200);

      const body = res.body as Record<string, any>;
      expect(body.about).toBe(updateDto.about);
      expect(body.welcomeMessage).toBe(updateDto.welcomeMessage);
      expect(body.businessHours).toEqual(updateDto.businessHours);
    });

    it('should fail with invalid business hours format', async () => {
      const invalidDto = {
        businessHours: {
          monday: { open: 123 }, // Should be string
        },
      };

      await request(server)
        .patch(`/api/v1/branches/${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /api/v1/branches', () => {
    it('should return all branches for the business', async () => {
      const res = await request(server)
        .get('/api/v1/branches')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const body = res.body as any[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body.find((b: any) => b.id === branchId)).toBeDefined();
    });
  });
});
