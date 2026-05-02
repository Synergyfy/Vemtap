import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { DataSource } from 'typeorm';
import {
  User,
  UserRole,
  UserStatus,
} from '../../src/modules/users/entities/user.entity';
import { Branch } from '../../src/modules/branches/entities/branch.entity';
import {
  Business,
  BusinessStatus,
} from '../../src/modules/businesses/entities/business.entity';
import { QRType } from '../../src/modules/qr-thrive/enums';
import * as bcrypt from 'bcrypt';

describe('QrThrive (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtToken: string;
  let branchId: string;
  let forbiddenBranchId: string;
  let userId: string;
  const suffix = Date.now().toString().slice(-6);

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  beforeAll(async () => {
    app = await createTestApp((builder) => {
      builder.overrideProvider(HttpService).useValue(mockHttpService);
      builder
        .overrideProvider(require('@nestjs/config').ConfigService)
        .useValue({
          get: jest.fn((key: string) => {
            if (key === 'VEMTAP_INTEGRATION_KEY')
              return 'vemtap_test_key_xyz789';
            if (key === 'QR_THRIVE_API_KEY') return 'qr_test_key_123';
            if (key === 'QR_THRIVE_BASE_URL')
              return 'https://api.qrthrive.com/v1';
            return process.env[key]; // Fallback to actual env for other keys
          }),
        });
    });

    dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(User);
    const businessRepo = dataSource.getRepository(Business);
    const branchRepo = dataSource.getRepository(Branch);

    // 1. Create a test user & business
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = await userRepo.save(
      userRepo.create({
        email: `qr-${suffix}@example.com`,
        password: hashedPassword,
        firstName: 'QR',
        lastName: 'Tester',
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
      }),
    );
    userId = user.id;

    const business = await businessRepo.save(
      businessRepo.create({
        name: 'Test Business',
        status: BusinessStatus.ACTIVE,
        uniqueCode: `QRBUS${suffix}`,
        ownerId: userId,
      }),
    );

    user.businessId = business.id;
    await userRepo.save(user);

    const branch = await branchRepo.save(
      branchRepo.create({
        name: 'Test Branch',
        businessId: business.id,
        uniqueCode: `QRBR${suffix}`,
      }),
    );
    branchId = branch.id;

    // 2. Create another business and branch (Forbidden to the first user)
    const otherUser = await userRepo.save(
      userRepo.create({
        email: `other-${suffix}@example.com`,
        password: hashedPassword,
        firstName: 'Other',
        lastName: 'User',
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
      }),
    );
    const otherBusiness = await businessRepo.save(
      businessRepo.create({
        name: 'Other Business',
        status: BusinessStatus.ACTIVE,
        uniqueCode: `FORBIDDENBUS${suffix}`,
        ownerId: otherUser.id,
      }),
    );
    const otherBranch = await branchRepo.save(
      branchRepo.create({
        name: 'Forbidden Branch',
        businessId: otherBusiness.id,
        uniqueCode: `FORBIDDENBR${suffix}`,
      }),
    );
    forbiddenBranchId = otherBranch.id;

    // Login to get token
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: `qr-${suffix}@example.com`,
        password: 'Password123!',
      });

    jwtToken = loginRes.body.access_token;

    // Create Admin user for plans test
    const { token: adminToken } =
      await require('../utils/auth').createAuthenticatedUser(
        app,
        UserRole.ADMIN,
      );
    (this as any).adminToken = adminToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/qr-thrive/sync (POST)', () => {
    it('should sync user with QR-Thrive', async () => {
      mockHttpService.post.mockReturnValue(
        of({ data: { id: `qr-u-${suffix}` } }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/qr-thrive/sync')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(201);

      expect(res.body.qrThriveUserId).toBe(`qr-u-${suffix}`);
    });
  });

  describe('/qr-thrive/branches/:id/qr-codes (POST)', () => {
    it('should create a QR code mapping for own branch', async () => {
      mockHttpService.post.mockReturnValue(
        of({
          data: {
            id: `qr-code-${suffix}`,
            shortId: `qr${suffix}`,
            name: 'Test QR',
            type: QRType.url,
            design: {},
            frame: {},
            data: { url: 'https://test.com' },
          },
        }),
      );

      const res = await request(app.getHttpServer())
        .post(`/api/v1/qr-thrive/branches/${branchId}/qr-codes`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'Test QR',
          type: QRType.url,
          data: { url: 'https://test.com' },
        })
        .expect(201);

      expect(res.body.qrThriveCodeId).toBe(`qr-code-${suffix}`);
    });

    it('should fail (403) when accessing forbidden branch', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/qr-thrive/branches/${forbiddenBranchId}/qr-codes`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'Hacker QR',
          type: QRType.url,
          data: { url: 'https://evil.com' },
        })
        .expect(403);
    });
  });

  describe('/qr-thrive/branches/:branchId/qr-codes/:qrCodeId/ubl (PATCH)', () => {
    it('should fail (400) with validation error if isFeatured is missing', async () => {
      await request(app.getHttpServer())
        .patch(
          `/api/v1/qr-thrive/branches/${branchId}/qr-codes/qr-code-uuid/ubl`,
        )
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({}) // Missing isFeatured
        .expect(400);
    });

    it('should fail (403) when accessing forbidden branch', async () => {
      await request(app.getHttpServer())
        .patch(
          `/api/v1/qr-thrive/branches/${forbiddenBranchId}/qr-codes/qr-code-uuid/ubl`,
        )
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ isFeatured: true })
        .expect(403);
    });

    it('should fail (404) if the QR code mapping does not exist', async () => {
      const res = await request(app.getHttpServer())
        .patch(
          `/api/v1/qr-thrive/branches/${branchId}/qr-codes/non-existent-qr/ubl`,
        )
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ isFeatured: true })
        .expect(404);

      expect(res.body.message).toContain('QR code mapping not found');
    });
  });

  describe('Analytics Endpoints', () => {
    it('should fetch scans using branch-scoped URL', async () => {
      mockHttpService.get.mockReturnValue(of({ data: [] }));

      await request(app.getHttpServer())
        .get(
          `/api/v1/qr-thrive/branches/${branchId}/qr-codes/qr-code-uuid/scans`,
        )
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });

    it('should fail (403) when fetching scans for forbidden branch', async () => {
      await request(app.getHttpServer())
        .get(
          `/api/v1/qr-thrive/branches/${forbiddenBranchId}/qr-codes/qr-code-uuid/scans`,
        )
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(403);
    });
  });

  describe('/qr-thrive/sso (GET)', () => {
    it('should return magic link', async () => {
      mockHttpService.post.mockReturnValue(
        of({ data: { url: 'https://api.qrthrive.com/magic' } }),
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/qr-thrive/sso')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body.url).toBe('https://api.qrthrive.com/magic');
    });
  });

  describe('/qr-thrive/plans (GET)', () => {
    it('should fetch plans from QR-Thrive (Admin only)', async () => {
      const adminToken = (this as any).adminToken || jwtToken;

      mockHttpService.get.mockReturnValue(
        of({ data: [{ id: 'p1', name: 'Plan 1' }] }),
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/qr-thrive/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0].name).toBe('Plan 1');
    });
  });

  describe('/integration/qr-thrive/callback (POST)', () => {
    const integrationKey = 'vemtap_test_key_xyz789';

    it('should fail (401) when API key is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/integration/qr-thrive/callback')
        .send({ event: 'test' })
        .expect(401);
    });

    it('should fail (401) when API key is incorrect', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/integration/qr-thrive/callback')
        .set('x-vemtap-api-key', 'wrong-key')
        .send({ event: 'test' })
        .expect(401);
    });

    it('should succeed (201) when API key is correct', async () => {
      // Note: We need to ensure the test environment uses our integrationKey
      await request(app.getHttpServer())
        .post('/api/v1/integration/qr-thrive/callback')
        .set('x-vemtap-api-key', integrationKey)
        .send({ event: 'test' })
        .expect(201);
    });
  });
});
