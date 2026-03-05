import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('Forms Module (E2E)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let visitorToken: string;
  let businessId: string;
  let createdFormId: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Create business owner
    const owner = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = owner.token;
    businessId = owner.user.businessId;

    // Create visitor
    const visitor = await createAuthenticatedUser(app, UserRole.CUSTOMER);
    visitorToken = visitor.token;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Business Owner Forms API', () => {
    it('should create a new form (/api/v1/business-forms POST)', async () => {
      const payload = {
        title: 'Customer Satisfaction Survey',
        description: 'Please let us know how we did.',
        isActive: true,
        isPublished: true,
        fields: [
          {
            type: 'text',
            question: 'What is your name?',
            isRequired: true,
          },
          {
            type: 'radio',
            question: 'How would you rate our service?',
            options: ['Poor', 'Average', 'Excellent'],
            isRequired: false,
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/business-forms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(payload)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(payload.title);
      createdFormId = res.body.id;
    });

    it('should get all forms for the business (/api/v1/business-forms GET)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/business-forms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].id).toBe(createdFormId);
    });
  });

  describe('Visitor Forms API', () => {
    let formFields: any[];

    it('should get active forms for a business (/api/v1/visitor-forms/business/:businessId GET)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/visitor-forms/business/${businessId}`)
        .set('Authorization', `Bearer ${visitorToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].id).toBe(createdFormId);
    });

    it('should retrieve a specific form to answer (/api/v1/visitor-forms/:id GET)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/visitor-forms/${createdFormId}`)
        .set('Authorization', `Bearer ${visitorToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', createdFormId);
      expect(res.body).toHaveProperty('fields');
      expect(res.body.fields.length).toBe(2);
      formFields = res.body.fields;
    });

    it('should submit form responses (/api/v1/visitor-forms/:id/responses POST)', async () => {
      const nameFieldId = formFields.find(
        (f) => f.question === 'What is your name?',
      ).id;

      const payload = {
        answers: [
          {
            fieldId: nameFieldId,
            value: 'John Doe Testing',
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(`/api/v1/visitor-forms/${createdFormId}/responses`)
        .set('Authorization', `Bearer ${visitorToken}`)
        .send(payload)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.formId).toBe(createdFormId);
      expect(res.body.answers.length).toBe(1);
      expect(res.body.answers[0].value).toBe('John Doe Testing');
    });
  });

  describe('Business Owner Viewing Responses', () => {
    it('should get all responses for a form (/api/v1/business-forms/:id/responses GET)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/business-forms/${createdFormId}/responses`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].answers.length).toBe(1);
    });
  });
});
