/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';
import { TicketStatus } from '../../src/modules/support/entities/support-ticket.entity';

describe('Agent Flow (e2e)', () => {
  let app: INestApplication;
  let agentToken: string;
  let agentId: string;
  let customerToken: string;
  let adminToken: string;
  let ticketId: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Setup Admin
    const adminData = await createAuthenticatedUser(app, UserRole.ADMIN);
    adminToken = adminData.token;

    // Setup Agent
    const agentData = await createAuthenticatedUser(app, UserRole.AGENT);
    agentToken = agentData.token;
    agentId = agentData.user.id;

    // Setup Customer
    const customerData = await createAuthenticatedUser(app, UserRole.CUSTOMER);
    customerToken = customerData.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Customer creates a ticket', async () => {
    const response = await request(app.getHttpServer())
      .post('/support/tickets')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        subject: 'E2E Ticket',
        category: 'Support',
        message: 'I need help',
      })
      .expect(201);

    ticketId = response.body.id;
    expect(ticketId).toBeDefined();
  });

  it('Admin assigns ticket to agent', async () => {
    await request(app.getHttpServer())
      .post(`/support/admin/tickets/${ticketId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ agentId })
      .expect(201);
  });

  it('Agent gets stats', async () => {
    const response = await request(app.getHttpServer())
      .get('/agent/stats')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('assignedChats');
    expect(response.body).toHaveProperty('openTickets');
  });

  it('Agent gets assigned tickets', async () => {
    const response = await request(app.getHttpServer())
      .get('/agent/tickets')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    // Note: Since createAuthenticatedUser might trigger things that create tickets,
    // we just check if it contains our ticketId
    const found = response.body.data.find((t: any) => t.id === ticketId);
    expect(found).toBeDefined();
  });

  it('Agent replies to ticket', async () => {
    await request(app.getHttpServer())
      .post(`/agent/tickets/${ticketId}/message`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ message: 'I am looking into it' })
      .expect(201);
  });

  it('Agent updates ticket status', async () => {
    await request(app.getHttpServer())
      .patch(`/agent/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: TicketStatus.RESOLVED })
      .expect(200);
  });

  it('Agent updates profile', async () => {
    await request(app.getHttpServer())
      .patch('/agent/profile')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ firstName: 'Support Agent Updated' })
      .expect(200);
  });
});
