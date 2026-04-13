import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';
import { KycStatus } from '../../src/modules/affiliates/entities/affiliate-profile.entity';
import { WithdrawalStatus } from '../../src/modules/affiliates/entities/withdrawal-request.entity';

describe('Affiliates System (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let agentToken: string;
  let adminId: string;
  let agentId: string;
  let affiliateProfileId: string;
  let withdrawalId: string;

  beforeAll(async () => {
    app = await createTestApp();

    const admin = await createAuthenticatedUser(app, UserRole.ADMIN);
    adminToken = admin.token;
    adminId = admin.user.id;

    const agent = await createAuthenticatedUser(app, UserRole.AGENT);
    agentToken = agent.token;
    agentId = agent.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Agent Workflows', () => {
    it('Agent should initialize their profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/affiliates/profile')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(201);

      expect(response.body.userId).toBe(agentId);
      expect(response.body.referralCode).toBeDefined();
      affiliateProfileId = response.body.id;
    });

    it('Agent should get dashboard stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/affiliates/stats')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalEarnings');
      expect(response.body).toHaveProperty('availableBalance');
      expect(response.body).toHaveProperty('referralCode');
    });

    it('Agent should update profile (KYC)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/affiliates/profile/update')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          idType: 'NIN',
          idNumber: '123456789',
          idImageUrl: 'https://example.com/nin.jpg',
          bankAccountDetails: {
            bankName: 'Test Bank',
            accountNumber: '0123456789',
            accountName: 'Test User'
          }
        })
        .expect(201);

      const profileRes = await request(app.getHttpServer())
        .get('/api/v1/affiliates/profile')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(profileRes.body.kycStatus).toBe(KycStatus.PENDING);
    });

    it('Agent should request a withdrawal', async () => {
      // First, manually add some balance to the profile for testing
      // In a real scenario, this would come from referrals
      const { DataSource } = require('typeorm');
      const dataSource = app.get(DataSource);
      const { AffiliateProfile } = require('../../src/modules/affiliates/entities/affiliate-profile.entity');
      const profileRepo = dataSource.getRepository(AffiliateProfile);
      
      const profile = await profileRepo.findOne({ where: { userId: agentId } });
      profile.availableBalance = 10000;
      await profileRepo.save(profile);

      const response = await request(app.getHttpServer())
        .post('/api/v1/affiliates/withdraw')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ amount: 6000 })
        .expect(201);

      expect(response.body.amount).toBe(6000);
      expect(response.body.status).toBe(WithdrawalStatus.PENDING);
      withdrawalId = response.body.id;
    });
  });

  describe('Admin Workflows', () => {
    it('Admin should list all profiles', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/affiliates/admin/profiles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some(p => p.id === affiliateProfileId)).toBe(true);
    });

    it('Admin should verify an affiliate KYC', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/affiliates/admin/profiles/${affiliateProfileId}/verify-kyc`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: KycStatus.VERIFIED })
        .expect(201);

      const profileRes = await request(app.getHttpServer())
        .get('/api/v1/affiliates/profile')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(profileRes.body.kycStatus).toBe(KycStatus.VERIFIED);
    });

    it('Admin should process a withdrawal', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/affiliates/admin/withdrawals/${withdrawalId}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          status: WithdrawalStatus.PAID,
          note: 'Paid via bank transfer'
        })
        .expect(201);

      // Check status in admin list
      const response = await request(app.getHttpServer())
        .get('/api/v1/affiliates/admin/withdrawals')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const updated = response.body.find(w => w.id === withdrawalId);
      expect(updated.status).toBe(WithdrawalStatus.PAID);
    });

    it('Admin should flag an affiliate', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/affiliates/admin/profiles/${affiliateProfileId}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          isFlagged: true,
          reason: 'Suspicious activity'
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/affiliates/admin/fraud')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.some(p => p.id === affiliateProfileId)).toBe(true);
    });
  });
});
