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

    const business = await businessRepo.save(
      businessRepo.create({
        name: 'E2E Test Business',
        ownerId: user.id,
      }),
    );
    businessId = business.id;

    // Update user with businessId (using type assertion or correct property)
    (user as any).businessId = businessId;
    await userRepo.save(user);

    // Refresh token by logging in again with updated user
    const loginRes = await request(server)
      .post('/api/v1/auth/login')
      .send({
        identifier: user.email,
        password: 'Password123!',
      })
      .expect(200);
    ownerToken = (loginRes.body as { access_token: string }).access_token;
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
