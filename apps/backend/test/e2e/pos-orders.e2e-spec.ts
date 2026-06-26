import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { createAuthenticatedUser } from '../utils/auth';
import { UserRole } from '../../src/modules/users/entities/user.entity';

describe('POS Orders (E2E)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let anotherOwnerToken: string;
  let businessId: string;
  let branchId: string;
  let anotherBusinessId: string;
  let anotherBranchId: string;
  let itemId: string;
  let offerId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const ownerRes = await createAuthenticatedUser(app, UserRole.OWNER);
    ownerToken = ownerRes.token;
    businessId = ownerRes.user.businessId;
    branchId = ownerRes.user.branchId;

    // Second business for cross-business isolation tests
    const anotherOwnerRes = await createAuthenticatedUser(app, UserRole.OWNER);
    anotherOwnerToken = anotherOwnerRes.token;
    anotherBusinessId = anotherOwnerRes.user.businessId;
    anotherBranchId = anotherOwnerRes.user.branchId;

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

    // Create a second item for the offer
    const item2Res = await request(app.getHttpServer())
      .post('/api/v1/catalogue/items')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'French Fries',
        price: 5.0,
        shortDescription: 'Crispy fries',
        description: 'Golden crispy french fries.',
        mainImage: 'https://image.com/fries.jpg',
        categoryId,
        branchId,
      })
      .expect(201);

    // Create an offer combining both items (SUM pricing = 20)
    const offerRes = await request(app.getHttpServer())
      .post('/api/v1/catalogue/offers')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Burger Meal Deal',
        description: 'Classic Burger + French Fries',
        pricingType: 'sum',
        branchId,
        itemIds: [itemId, item2Res.body.id],
      })
      .expect(201);
    offerId = offerRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/pos/orders (Place POS Order)', () => {
    describe('Public mode (no auth)', () => {
      it('should place an order as a walk-in customer with items', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/pos/orders')
          .send({
            branchId,
            firstName: 'Jane',
            lastName: 'Public',
            phone: '+2347090000001',
            items: [{ itemId, quantity: 2 }],
            notes: 'No onions',
          })
          .expect(201);

        expect(res.body.totalAmount).toBe(30);
        expect(res.body.status).toBe('new');
        expect(res.body.customer.firstName).toBe('Jane');
        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].itemId).toBe(itemId);
        expect(res.body.items[0].quantity).toBe(2);
        expect(res.body.stockDeducted).toBe(true);
        expect(res.body.businessId).toBe(businessId);
        expect(res.body.branchId).toBe(branchId);
      });

      it('should place an order with an offer', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/pos/orders')
          .send({
            branchId,
            firstName: 'Offer',
            lastName: 'Customer',
            phone: '+2347090000002',
            items: [{ offerId, quantity: 1 }],
          })
          .expect(201);

        expect(res.body.status).toBe('new');
        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].offerId).toBe(offerId);
        expect(res.body.totalAmount).toBeGreaterThan(0);
      });

      it('should reject if customer info is missing', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/pos/orders')
          .send({
            branchId,
            items: [{ itemId, quantity: 1 }],
          })
          .expect(400);
      });

      it('should reject if items array is empty', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/pos/orders')
          .send({
            branchId,
            firstName: 'Empty',
            lastName: 'Cart',
            phone: '+2347090000003',
            items: [],
          })
          .expect(400);
      });

      it('should reject if branch does not exist', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/pos/orders')
          .send({
            branchId: '00000000-0000-0000-0000-000000000000',
            firstName: 'No',
            lastName: 'Branch',
            phone: '+2347090000004',
            items: [{ itemId, quantity: 1 }],
          })
          .expect(404);
      });
    });

    describe('Staff mode (with auth)', () => {
      it('should place an order as staff with an existing customerId', async () => {
        // First create a customer via public mode
        const customerRes = await request(app.getHttpServer())
          .post('/api/v1/pos/orders')
          .send({
            branchId,
            firstName: 'Existing',
            lastName: 'Customer',
            phone: '+2347090000010',
            items: [{ itemId, quantity: 1 }],
          })
          .expect(201);
        const customerId = customerRes.body.customerId;

        // Now staff places order with the existing customer
        const res = await request(app.getHttpServer())
          .post('/api/v1/pos/orders')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            branchId,
            customerId,
            items: [{ itemId, quantity: 3 }],
          })
          .expect(201);

        expect(res.body.totalAmount).toBe(45);
        expect(res.body.customerId).toBe(customerId);
        expect(res.body.customer.id).toBe(customerId);
      });

      it('should reject if customerId references a non-existing user', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/pos/orders')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            branchId,
            customerId: '00000000-0000-0000-0000-000000000000',
            items: [{ itemId, quantity: 1 }],
          })
          .expect(404);
      });
    });

    describe('Cross-business isolation', () => {
      it('should not allow ordering an item from another business', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/pos/orders')
          .set('Authorization', `Bearer ${anotherOwnerToken}`)
          .send({
            branchId: anotherBranchId,
            items: [{ itemId, quantity: 1 }],
            firstName: 'Cross',
            lastName: 'Biz',
            phone: '+2347090000099',
          })
          .expect(404);
      });
    });
  });

  describe('POST /api/v1/pos/orders/:id/process-payment (Process Payment)', () => {
    let testOrderId: string;

    beforeEach(async () => {
      // Create a fresh order for payment tests
      const orderRes = await request(app.getHttpServer())
        .post('/api/v1/pos/orders')
        .send({
          branchId,
          firstName: 'Payment',
          lastName: 'Test',
          phone: '+2347090000020',
          items: [{ itemId, quantity: 2 }],
        })
        .expect(201);
      testOrderId = orderRes.body.id;
    });

    it('should process cash payment and complete the order', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/pos/orders/${testOrderId}/process-payment`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          paymentMethod: 'cash',
          amountPaid: 40,
          change: 10,
        })
        .expect(201);

      expect(res.body.sale).toBeDefined();
      expect(res.body.order).toBeDefined();

      // Verify sale
      expect(res.body.sale.total).toBe(30);
      expect(res.body.sale.paymentMethod).toBe('cash');
      expect(res.body.sale.amountPaid).toBe(40);
      expect(res.body.sale.change).toBe(10);
      expect(res.body.sale.status).toBe('completed');
      expect(res.body.sale.cashierId).toBeDefined();
      expect(res.body.sale.customerId).toBeDefined();
      expect(res.body.sale.receiptNumber).toMatch(/^RCT-/);

      // Verify sale is linked to order
      expect(res.body.sale.orderId).toBe(testOrderId);

      // Verify order status updated to completed
      expect(res.body.order.status).toBe('completed');
      expect(res.body.order.id).toBe(testOrderId);
    });

    it('should process transfer payment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/pos/orders/${testOrderId}/process-payment`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          paymentMethod: 'transfer',
          amountPaid: 30,
        })
        .expect(201);

      expect(res.body.sale.paymentMethod).toBe('transfer');
      expect(res.body.sale.total).toBe(30);
      expect(res.body.order.status).toBe('completed');
    });

    it('should process split payment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/pos/orders/${testOrderId}/process-payment`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          paymentMethod: 'split',
          amountPaid: 30,
          splitDetails: [
            { method: 'cash', amount: 15 },
            { method: 'transfer', amount: 15 },
          ],
        })
        .expect(201);

      expect(res.body.sale.paymentMethod).toBe('split');
      expect(res.body.sale.splitPayments).toHaveLength(2);
      expect(res.body.order.status).toBe('completed');
    });

    it('should reject split payment with mismatched totals', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/pos/orders/${testOrderId}/process-payment`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          paymentMethod: 'split',
          amountPaid: 30,
          splitDetails: [
            { method: 'cash', amount: 10 },
            { method: 'transfer', amount: 10 },
          ],
        })
        .expect(400);
    });

    it('should reject payment for an already completed order', async () => {
      // First payment
      await request(app.getHttpServer())
        .post(`/api/v1/pos/orders/${testOrderId}/process-payment`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ paymentMethod: 'cash', amountPaid: 30 })
        .expect(201);

      // Second payment attempt should fail
      await request(app.getHttpServer())
        .post(`/api/v1/pos/orders/${testOrderId}/process-payment`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ paymentMethod: 'cash', amountPaid: 30 })
        .expect(400);
    });

    it('should reject payment without auth token', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/pos/orders/${testOrderId}/process-payment`)
        .send({ paymentMethod: 'cash', amountPaid: 30 })
        .expect(401);
    });

    it('should reject payment for orders from another business', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/pos/orders/${testOrderId}/process-payment`)
        .set('Authorization', `Bearer ${anotherOwnerToken}`)
        .send({ paymentMethod: 'cash', amountPaid: 30 })
        .expect(404);
    });
  });
});
