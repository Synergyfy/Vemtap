import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('Catalogue (E2E)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let businessId: string;
  let branchId: string;
  let categoryId: string;
  let itemId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const ownerRes = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = ownerRes.token;
    businessId = ownerRes.user.businessId;
    branchId = ownerRes.user.branchId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Catalogue Management (Admin)', () => {
    it('should create a category', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/catalogue/categories')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Drinks' })
        .expect(201);

      expect(res.body.name).toBe('Drinks');
      categoryId = res.body.id;
    });

    it('should create an item', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/catalogue/items')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Coca Cola',
          price: 1.5,
          shortDescription: 'Cold and refreshing',
          description: 'A classic sparkling soda.',
          mainImage: 'https://image.com/coke.jpg',
          categoryId,
          branchId,
        })
        .expect(201);

      expect(res.body.name).toBe('Coca Cola');
      itemId = res.body.id;
    });

    it('should list items for the branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/catalogue/items?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].name).toBe('Coca Cola');
    });

    it('should update an item globally', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/catalogue/items/${itemId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Coca Cola Zero',
          applyGlobally: true,
        })
        .expect(200);
    });
  });

  describe('Catalogue Display (Public)', () => {
    it('should list categories for a business', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/public/catalogue/categories/business/${businessId}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.some((c) => c.id === categoryId)).toBe(true);
    });

    it('should list items for a branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/public/catalogue/items/branch/${branchId}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some((i) => i.id === itemId)).toBe(true);
    });

    it('should search items by name', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/public/catalogue/items/branch/${branchId}?search=Zero`)
        .expect(200);

      expect(res.body.data[0].name).toContain('Zero');
    });
  });
});
