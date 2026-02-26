import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';

describe('Health Check (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/public-test (GET) should return 200', () => {
    return request(app.getHttpServer())
      .get('/api/v1/public-test')
      .expect(200)
      .expect('This is public');
  });
});
