import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole, User } from '../../src/modules/users/entities/user.entity';

interface TemplateResponse {
  id: string;
  name: string;
  description: string;
  fields: any[];
}

interface TemplateListResponse {
  items: TemplateResponse[];
  total: number;
}

interface AuthResult {
  token: string;
  user: User;
}

describe('Form Templates (E2E)', () => {
  let app: INestApplication;
  let adminToken: string;
  let ownerToken: string;
  let branchId: string;
  let templateId: string;

  beforeAll(async () => {
    app = await createTestApp();

    const adminRes = (await createAuthenticatedUser(
      app,
      UserRole.ADMIN,
    )) as unknown as AuthResult;
    adminToken = adminRes.token;

    const ownerRes = (await createAuthenticatedUser(
      app,
      UserRole.OWNER,
    )) as unknown as AuthResult;
    ownerToken = ownerRes.token;
    branchId = ownerRes.user.branchId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Admin Template Management', () => {
    it('should create a new form template (Admin)', async () => {
      const payload = {
        name: 'Standard Feedback Template',
        description: 'A standard feedback form for all businesses',
        fields: [
          {
            type: 'text',
            question: 'How was your experience?',
            isRequired: true,
            order: 0,
          },
          {
            type: 'select',
            question: 'Rating',
            options: ['Good', 'Average', 'Poor'],
            isRequired: true,
            order: 1,
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/form-templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      const body = res.body as TemplateResponse;
      templateId = body.id;
      expect(templateId).toBeDefined();
      expect(body.name).toBe(payload.name);
      expect(body.fields).toHaveLength(2);
    });

    it('should list all templates (Admin)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/form-templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as TemplateListResponse;
      expect(body.items).toBeDefined();
      expect(body.items.length).toBeGreaterThan(0);
    });

    it('should search templates by name (Admin)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/form-templates?search=Standard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as TemplateListResponse;
      expect(body.items[0].name).toContain('Standard');
    });

    it('should update a template (Admin)', async () => {
      const updatePayload = {
        name: 'Updated Template Name',
      };

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/form-templates/${templateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload)
        .expect(200);

      const body = res.body as TemplateResponse;
      expect(body.name).toBe('Updated Template Name');
    });
  });

  describe('Business Owner Template Usage', () => {
    it('should list all templates (Business Owner)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/form-templates')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const body = res.body as TemplateListResponse;
      expect(body.items).toBeDefined();
    });

    it('should use a template to create a branch form', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/form-templates/${templateId}/use?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(201);

      const body = res.body as { id: string; branchId: string; fields: any[] };
      expect(body.id).toBeDefined();
      expect(body.branchId).toBe(branchId);
      expect(body.fields).toHaveLength(2);
    });

    it('should NOT allow business owner to create a template', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/form-templates')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Unauthorized' })
        .expect(403);
    });
  });
});
