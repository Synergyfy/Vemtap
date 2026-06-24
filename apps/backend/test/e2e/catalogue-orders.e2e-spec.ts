import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('Catalogue Orders (E2E)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let businessId: string;
  let branchId: string;
  let itemId: string;
  let orderId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const ownerRes = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = ownerRes.token;
    businessId = ownerRes.user.businessId;
    branchId = ownerRes.user.branchId;

    // Create a category
    const categoryRes = await request(app.getHttpServer())
      .post('/api/v1/catalogue/categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Burgers' })
      .expect(201);
    const categoryId = categoryRes.body.id;

    // Create a product for ordering
    const itemRes = await request(app.getHttpServer())
      .post('/api/v1/catalogue/items')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Classic Burger',
        price: 15.0,
        shortDescription: 'Good burger',
        description: 'Testing purposes burger.',
        mainImage: 'https://image.com/burger.jpg',
        categoryId,
        branchId,
      })
      .expect(201);
    itemId = itemRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Order Placement (Public)', () => {
    it('should place a new order', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/catalogue/orders')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          phone: '+2348012345678',
          email: 'john@example.com',
          branchId,
          tableNumber: 'Table 5',
          notes: 'No onions please',
          items: [{ itemId, quantity: 2 }],
        })
        .expect(201);

      expect(res.body.totalAmount).toBe(30);
      expect(res.body.status).toBe('new');
      orderId = res.body.id;
    });
  });

  describe('Order Management (Admin)', () => {
    it('should list orders for the business', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/catalogue/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some((o) => o.id === orderId)).toBe(true);
    });

    it('should get order details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/catalogue/orders/${orderId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.id).toBe(orderId);
      expect(res.body.customer.firstName).toBe('John');
    });

    it('should update order status', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/catalogue/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'processing' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/catalogue/orders/${orderId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.body.status).toBe('processing');
    });
  });
});
