import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { DataSource } from 'typeorm';
import { Business } from '../../src/modules/businesses/entities/business.entity';

describe('Businesses (E2E)', () => {
  let app: INestApplication;
  let server: any;
  let ownerToken: string;
  let businessId: string;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    // Setup Owner and Business
    const { token, user } = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = token;

    // Create a business manually for this user if not automatically done
    const dataSource = app.get(DataSource);
    const businessRepo = dataSource.getRepository(Business);
    const userRepo = dataSource.getRepository(User);

    const business = businessRepo.create({
        name: 'E2E Test Business',
        ownerId: user.id,
    });
    const savedBusiness = await businessRepo.save(business);
    businessId = savedBusiness.id;
    
    // Update user with businessId
    user.businessId = businessId;
    await userRepo.save(user);

    // Refresh token by logging in again with updated user
    const loginRes = await request(server)
      .post('/api/v1/auth/login')
      .send({
        identifier: user.email,
        password: 'Password123!',
      })
      .expect(200);
    ownerToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PATCH /api/v1/businesses/my-business', () => {
    it('should update business about and hours', async () => {
      const updateDto = {
        about: 'This is a test business for E2E.',
        businessHours: {
          monday: { open: '08:00', close: '18:00' },
          tuesday: { open: '08:00', close: '18:00' },
          sunday: { closed: true },
        },
      };

      const res = await request(server)
        .patch('/api/v1/businesses/my-business')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateDto)
        .expect(200);

      expect(res.body.about).toBe(updateDto.about);
      expect(res.body.businessHours).toEqual(updateDto.businessHours);
    });

    it('should fail with invalid business hours format', async () => {
        const invalidDto = {
          businessHours: {
            monday: { open: 123, close: 'invalid' }, // Should be strings
          },
        };
  
        await request(server)
          .patch('/api/v1/businesses/my-business')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(invalidDto)
          .expect(400);
      });
  });

  describe('GET /api/v1/businesses/my-business', () => {
    it('should return updated business details', async () => {
      const res = await request(server)
        .get('/api/v1/businesses/my-business')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.id).toBe(businessId);
      expect(res.body.about).toBeDefined();
      expect(res.body.businessHours).toBeDefined();
    });
  });
});
