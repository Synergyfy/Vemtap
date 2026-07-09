import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { DataSource } from 'typeorm';

describe('Module Permissions Enforcement (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ownerToken: string;
  let branchId: string;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    const ownerRes = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = ownerRes.token;
    branchId = ownerRes.user.branchId;
  });

  afterAll(async () => {
    await app.close();
  });

  async function createStaffWithPermissions(permissions: string[]) {
    const staffRes = await createAuthenticatedUser(
      app,
      UserRole.STAFF,
      branchId,
    );
    const userRepo = dataSource.getRepository(User);
    await userRepo.update(staffRes.user.id, { permissions });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: staffRes.user.email,
        password: 'Password123!',
      });

    return loginRes.body.access_token;
  }

  describe('Permission Guard Enforcement', () => {
    it('Staff with "visitors" should access visitors but NOT loyalty', async () => {
      const token = await createStaffWithPermissions(['visitors']);

      // Loyalty: GET /api/v1/loyalty/reward-templates (Protected with @Roles(OWNER, ADMIN))
      // It should return 403 because role is STAFF
      await request(app.getHttpServer())
        .get('/api/v1/loyalty/reward-templates')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Staff Management: GET /api/v1/users/team (Protected with @Permissions('staff'))
      await request(app.getHttpServer())
        .get(`/api/v1/users/team?branchId=${branchId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('Staff with "pos" should access loyalty points endpoints', async () => {
      const token = await createStaffWithPermissions(['pos']);

      // Loyalty points give: POST /api/v1/loyalty/points/give (Protected with @Permissions('pos'))
      await request(app.getHttpServer())
        .post('/api/v1/loyalty/points/give')
        .set('Authorization', `Bearer ${token}`)
        .send({ customerCode: '123456', points: 10, branchId })
        .expect(404); // Not found because customercode is invalid, but NOT 403
    });

    it('Staff with "staff" should access team management', async () => {
      const token = await createStaffWithPermissions(['staff']);

      // Staff Management: Should pass
      await request(app.getHttpServer())
        .get(`/api/v1/users/team?branchId=${branchId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
