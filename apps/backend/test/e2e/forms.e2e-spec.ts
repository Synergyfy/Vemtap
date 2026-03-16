import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('Forms Module (E2E)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let visitorToken: string;
  let branchId: string;
  let formId: string;
  let fieldId: string;
  let formUniqueCode: string;

  beforeAll(async () => {
    app = await createTestApp();

    const ownerRes = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = ownerRes.token;
    branchId = ownerRes.user.branchId;

    const visitorRes = await createAuthenticatedUser(
      app,
      UserRole.CUSTOMER,
      branchId,
    );
    visitorToken = visitorRes.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Business Owner Forms API', () => {
    it('should create a new form', async () => {
      const payload = {
        title: 'Feedback Form',
        description: 'Tell us what you think',
        branchId: branchId,
        isActive: true,
        isPublished: true,
        fields: [
          {
            type: 'text',
            question: 'Name?',
            isRequired: true,
            order: 1,
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/business-forms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(payload)
        .expect(201);

      formId = res.body.id;
      fieldId = res.body.fields[0].id;
      formUniqueCode = res.body.uniqueCode;
      expect(formId).toBeDefined();
      expect(fieldId).toBeDefined();
      expect(formUniqueCode).toBeDefined();
    });

    it('should get all forms for the branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/business-forms?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Visitor Forms API', () => {
    it('should get active forms for a branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/visitor-forms/branch/${branchId}`)
        .set('Authorization', `Bearer ${visitorToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should submit a form response', async () => {
      const payload = {
        branchId: branchId,
        answers: [
          {
            fieldId: fieldId,
            value: 'John Doe',
          },
        ],
      };

      await request(app.getHttpServer())
        .post(`/api/v1/visitor-forms/${formUniqueCode}/responses`)
        .set('Authorization', `Bearer ${visitorToken}`)
        .send(payload)
        .expect(201);
    });
  });
});
