import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';

describe('Authenticated Routes (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/profile (GET) should return user profile for authenticated user', async () => {
    const { token, user } = await createAuthenticatedUser(app);

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('email', user.email);
    expect(response.body).toHaveProperty('id');
    expect(response.body).not.toHaveProperty('password');
  });

  it('/auth/profile (GET) should fail without token', () => {
    return request(app.getHttpServer())
      .get('/api/v1/auth/profile')
      .expect(401);
  });
});
