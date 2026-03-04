import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('Control Tower (E2E)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const admin = await createAuthenticatedUser(app, UserRole.ADMIN);
    adminToken = admin.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/admin/control-tower/businesses (GET)', () => {
    it('should return 200 for admins', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/control-tower/businesses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should return 403 for non-admins', async () => {
      const customer = await createAuthenticatedUser(app, UserRole.CUSTOMER);
      return request(app.getHttpServer())
        .get('/api/v1/admin/control-tower/businesses')
        .set('Authorization', `Bearer ${customer.token}`)
        .expect(403);
    });
  });

  describe('/admin/control-tower/customers (GET)', () => {
    it('should return 200 for admins', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/control-tower/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
