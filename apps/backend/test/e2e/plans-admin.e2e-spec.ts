import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('Plans Admin (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let planId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const admin = await createAuthenticatedUser(app, UserRole.ADMIN);
    adminToken = admin.token;
  }, 300000);

  afterAll(async () => {
    await app.close();
  });

  it('Admin should create a plan with automation limits', async () => {
    const planData = {
      name: 'Automation Pro Plan',
      monthlyPrice: 5000,
      isActive: true,
      features: ['Automations Included', 'Priority Support'],
      trialDurationDays: 14,
      automationsEnabled: true,
      maxAutomations: 10,
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/plans/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(planData)
      .expect(201);

    planId = response.body.id;
    expect(planId).toBeDefined();
    expect(response.body.name).toBe(planData.name);
    expect(response.body.automationsEnabled).toBe(true);
    expect(response.body.maxAutomations).toBe(10);
  });

  it('Admin should update plan automation limits', async () => {
    const updateData = {
      maxAutomations: 20,
    };

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/plans/admin/${planId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body.maxAutomations).toBe(20);
  });

  it('Public should be able to see the new fields in plans', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/plans')
      .expect(200);

    const plan = response.body.find((p: any) => p.id === planId);
    expect(plan).toBeDefined();
    expect(plan.automationsEnabled).toBe(true);
    expect(plan.maxAutomations).toBe(20);
  });

  it('Admin should delete the plan', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/plans/admin/${planId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/plans/${planId}`)
      .expect(404);
  });
});
