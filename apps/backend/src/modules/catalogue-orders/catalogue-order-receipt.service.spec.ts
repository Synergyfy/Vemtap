import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CatalogueOrder } from './entities/catalogue-order.entity';
import {
  CatalogueOrderReceiptService,
  orderReference,
  receiptAmount,
} from './catalogue-order-receipt.service';

async function build(order: unknown) {
  const orders = { findOne: jest.fn().mockResolvedValue(order) };
  const module = await Test.createTestingModule({
    providers: [
      CatalogueOrderReceiptService,
      { provide: getRepositoryToken(CatalogueOrder), useValue: orders },
    ],
  }).compile();
  return { service: module.get(CatalogueOrderReceiptService), orders };
}

describe('CatalogueOrderReceiptService', () => {
  it('formats the reference and amounts the PDF can draw', () => {
    expect(orderReference('abcdef12-3456')).toBe('#ABCDEF12');
    expect(receiptAmount('4500')).toBe('NGN 4,500.00');
    expect(receiptAmount(null)).toBe('NGN 0.00');
  });

  it('builds a PDF for the customer’s own order', async () => {
    const { service, orders } = await build({
      id: 'abcdef12-3456-7890-abcd-ef1234567890',
      createdAt: new Date('2026-10-17T10:00:00Z'),
      status: 'new',
      totalAmount: 9000,
      tableNumber: '12',
      notes: 'No onions',
      branch: {
        name: 'Wuse',
        address: 'Plot 4',
        business: { name: 'Aurora Grill' },
      },
      items: [{ quantity: 2, priceAtOrder: 4500, item: { name: 'Wrap' } }],
    });

    const file = await service.buildForCustomer('cust-1', 'order-1');

    expect(orders.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-1', customerId: 'cust-1' },
      }),
    );
    expect(file.mimeType).toBe('application/pdf');
    expect(file.filename).toBe('vemtap-receipt-abcdef12.pdf');
    expect(
      Buffer.from(file.contentBase64, 'base64').subarray(0, 5).toString(),
    ).toBe('%PDF-');
  });

  it('hides orders that are not the caller’s', async () => {
    const { service } = await build(null);
    await expect(
      service.buildForCustomer('cust-1', 'order-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
