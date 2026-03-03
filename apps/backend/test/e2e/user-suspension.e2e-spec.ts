import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole, UserStatus } from '../../src/modules/users/entities/user.entity';
import { DataSource } from 'typeorm';

describe('User Suspension (E2E)', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let customerEmail: string;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    // Setup Admin
    const adminData = await createAuthenticatedUser(app, UserRole.ADMIN);
    adminToken = adminData.token;

    // Setup Customer
    const customerData = await createAuthenticatedUser(app, UserRole.CUSTOMER);
    customerToken = customerData.token;
    customerId = customerData.user.id;
    customerEmail = customerData.user.email;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow customer to access profile initially', async () => {
    await request(server)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
  });

  it('should suspend customer account by admin', async () => {
    await request(server)
      .patch(`/api/v1/users/admin/${customerId}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe(UserStatus.SUSPENDED);
      });
  });

  it('should block suspended customer from accessing profile', async () => {
    await request(server)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toBe('Your account has been suspended. Please contact support.');
      });
  });

  it('should still allow suspended customer to login', async () => {
    await request(server)
      .post('/api/v1/auth/login')
      .send({
        identifier: customerEmail,
        password: 'Password123!',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
      });
  });

  it('should activate customer account by admin', async () => {
    await request(server)
      .patch(`/api/v1/users/admin/${customerId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe(UserStatus.ACTIVE);
      });
  });

  it('should allow customer to access profile again after activation', async () => {
    await request(server)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
  });
});
