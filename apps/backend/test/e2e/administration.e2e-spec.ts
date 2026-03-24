import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole, User } from '../../src/modules/users/entities/user.entity';
import { BackendModule } from '../../src/common/enums/backend-module.enum';
import { DataSource } from 'typeorm';

describe('Administration & Impersonation (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let agentId: string;
  let branchId: string;
  let businessId: string;
  let impersonationToken: string;
  let agentEmail: string;

  beforeAll(async () => {
    app = await createTestApp();

    const admin = await createAuthenticatedUser(app, UserRole.ADMIN);
    adminToken = admin.token;

    const ownerRes = await createAuthenticatedUser(app, UserRole.OWNER);
    branchId = ownerRes.user.branchId;
    businessId = ownerRes.user.businessId;
  }, 300000);

  afterAll(async () => {
    await app.close();
  });

  it('Admin creates an agent with permissions', async () => {
    agentEmail = `agent-${Date.now()}@test.com`;
    const response = await request(app.getHttpServer())
      .post('/api/v1/administration/agents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: agentEmail,
        firstName: 'Test',
        lastName: 'Agent',
        password: 'Password123!',
        phone: `+234${Date.now().toString().slice(-10)}`,
        permissions: [BackendModule.TICKETS, BackendModule.LOYALTY],
      })
      .expect(201);

    agentId = response.body.id;
    expect(agentId).toBeDefined();
    expect(response.body.permissions).toContain(BackendModule.TICKETS);
  });

  it('Admin generates an impersonation token for the agent', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/administration/impersonation/token')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        actorId: agentId,
        targetBranchId: branchId,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
      .expect(201);

    impersonationToken = response.body.token;
    expect(impersonationToken).toBeDefined();
  });

  it('Agent performs action using impersonation token (Audit Check)', async () => {
    // Login as agent
    const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
            identifier: agentEmail,
            password: 'Password123!'
        })
        .expect(200);
    
    const activeAgentToken = loginRes.body.access_token;

    // Perform an action that should be audited and restricted by module
    await request(app.getHttpServer())
      .get(`/api/v1/support/tickets?branchId=${branchId}&page=1&limit=10`)
      .set('Authorization', `Bearer ${activeAgentToken}`)
      .set('x-impersonation-token', impersonationToken)
      .expect(200);
  });

  it('Agent is forbidden from unauthorized modules', async () => {
    const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
            identifier: agentEmail,
            password: 'Password123!'
        })
        .expect(200);
    
    const activeAgentToken = loginRes.body.access_token;

    // Agent doesn't have VISITORS permission
    await request(app.getHttpServer())
      .get(`/api/v1/visitors?branchId=${branchId}`)
      .set('Authorization', `Bearer ${activeAgentToken}`)
      .set('x-impersonation-token', impersonationToken)
      .expect(403);
  });

  it('Admin views audit logs', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/administration/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
    // Find the log we just created
    const log = response.body.data.find((l: any) => l.actorId === agentId);
    expect(log).toBeDefined();
    expect(log.module).toBe(BackendModule.TICKETS);
  });
});
