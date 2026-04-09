import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';
import { DataSource } from 'typeorm';
import { SupportKnowledge } from '../../src/modules/support/entities/support-bot.entity';

describe('Support Bot (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    const auth = await createAuthenticatedUser(app, UserRole.CUSTOMER);
    token = auth.token;

    // Seed test knowledge
    const repo = dataSource.getRepository(SupportKnowledge);
    await repo.save([
      repo.create({
        question: 'what is vemtap',
        answer: 'VemTap is an engagement platform.',
        keywords: ['vemtap', 'platform'],
        isActive: true,
      }),
      repo.create({
        question: 'how to buy credits',
        answer: 'Go to billing settings.',
        keywords: ['credits', 'buy', 'billing'],
        isActive: true,
      }),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/support/bot/query (POST) - should return exact match', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/support/bot/query')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'what is vemtap' })
      .expect(201);

    expect(response.body.content).toBe('VemTap is an engagement platform.');
    expect(response.body.source).toBe('rule');
  });

  it('/support/bot/query (POST) - should return keyword match', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/support/bot/query')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'I want to buy some credits' })
      .expect(201);

    expect(response.body.content).toBe('Go to billing settings.');
    expect(response.body.source).toBe('rule');
  });

  it('/support/bot/query (POST) - should return fallback for unknown query', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/support/bot/query')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'how do i cook pasta?' })
      .expect(201);

    expect(response.body.source).toBe('fallback');
    expect(response.body.content).toContain('human agent');
  });

  it('/support/bot/query (POST) - should fail without auth', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/support/bot/query')
      .send({ query: 'hello' })
      .expect(401);
  });
});
