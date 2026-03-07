import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import {
  UserRole,
  UserStatus,
} from '../../src/modules/users/entities/user.entity';

describe('User Suspension (E2E)', () => {
  let app: INestApplication;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;

  beforeAll(async () => {
    app = await createTestApp();

    const admin = await createAuthenticatedUser(app, UserRole.ADMIN);
    adminToken = admin.token;

    const customer = await createAuthenticatedUser(app, UserRole.CUSTOMER);
    customerToken = customer.token;
    customerId = customer.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should suspend customer account by admin', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/users/admin/${customerId}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe(UserStatus.SUSPENDED);
      });
  });

  it('should block suspended customer from accessing profile', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    expect(response.body.message).toBe(
      'Your account has been suspended. Please contact support.',
    );
  });

  it('should activate customer account by admin', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/users/admin/${customerId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe(UserStatus.ACTIVE);
      });
  });

  it('should allow activated customer to access profile', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
  });
});
