import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import {
  UserRole,
  User,
  UserStatus,
} from '../../src/modules/users/entities/user.entity';
import { TicketStatus } from '../../src/modules/support/entities/support-ticket.entity';

describe('Agent Flow (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let agentToken: string;
  let customerToken: string;
  let ticketId: string;
  let agentId: string;
  let branchId: string;

  beforeAll(async () => {
    app = await createTestApp();

    const admin = await createAuthenticatedUser(app, UserRole.ADMIN);
    adminToken = admin.token;

    // Use OWNER to automatically create business and main branch
    const ownerRes = await createAuthenticatedUser(app, UserRole.OWNER);
    branchId = ownerRes.user.branchId;

    const agent = await createAuthenticatedUser(app, UserRole.AGENT, branchId);
    agentToken = agent.token;
    agentId = agent.user.id;

    const customer = await createAuthenticatedUser(app, UserRole.CUSTOMER, branchId);
    customerToken = customer.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Customer creates a ticket', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/support/tickets')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        subject: 'Help me',
        category: 'General',
        message: 'I need help',
      })
      .expect(201);

    ticketId = response.body.id;
    expect(ticketId).toBeDefined();
  });

  it('Admin assigns ticket to agent', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/support/admin/tickets/${ticketId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ agentId })
      .expect(201);
  });

  it('Agent gets stats', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/agent/stats?branchId=${branchId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('assignedChats');
    expect(response.body).toHaveProperty('openTickets');
  });

  it('Agent gets assigned tickets', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/agent/tickets?branchId=${branchId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('Agent replies to ticket', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/agent/tickets/${ticketId}/message?branchId=${branchId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ message: 'I am looking into it' })
      .expect(201);
  });

  it('Agent updates ticket status', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/agent/tickets/${ticketId}/status?branchId=${branchId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: TicketStatus.RESOLVED })
      .expect(200);
  });

  it('Agent updates profile', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/agent/profile')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ firstName: 'Support Agent Updated' })
      .expect(200);
  });
});
