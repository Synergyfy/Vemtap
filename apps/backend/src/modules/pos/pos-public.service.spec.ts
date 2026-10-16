import { NotFoundException } from '@nestjs/common';
import { PosPublicService } from './pos-public.service';
import { CatalogueOrderStatus } from '../catalogue-orders/entities/catalogue-order.entity';

describe('PosPublicService', () => {
  const orderRepo = { findOne: jest.fn() };
  const branchRepo = { findOne: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const service = new PosPublicService(
    orderRepo as never,
    branchRepo as never,
    businessRepo as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('tracks an order without exposing guest or staff details', async () => {
    orderRepo.findOne.mockResolvedValueOnce({
      id: 'abcdef12-3456',
      businessId: 'bus-1',
      status: CatalogueOrderStatus.PROCESSING,
      createdAt: new Date('2026-10-16T12:00:00Z'),
      statusTimeline: {
        new: '2026-10-16T12:00:00.000Z',
        processing: '2026-10-16T12:03:00.000Z',
      },
      totalAmount: 27950,
      tableNumber: '12',
      customer: { phone: '+2348000000000', email: 'guest@x.com' },
      attendedByUser: { firstName: 'Musa', lastName: 'Bello', phone: '+234' },
      branch: { name: 'Wuse 2' },
      items: [{ quantity: 1, priceAtOrder: 27950, item: { name: 'Platter' } }],
    });
    businessRepo.findOne.mockResolvedValueOnce({
      name: 'Urban Grill',
      posSettings: { defaultPrepMinutes: 20 },
    });

    const result = await service.track('token');

    expect(result.steps).toEqual([
      { status: 'new', at: '2026-10-16T12:00:00.000Z', reached: true },
      { status: 'processing', at: '2026-10-16T12:03:00.000Z', reached: true },
      { status: 'ready', at: null, reached: false },
      { status: 'completed', at: null, reached: false },
    ]);
    expect(result.estimatedReadyAt).toBe('2026-10-16T12:20:00.000Z');
    expect(result.server).toEqual({ firstName: 'Musa' });
    const json = JSON.stringify(result);
    expect(json).not.toContain('+2348000000000');
    expect(json).not.toContain('Bello');
    expect(json).not.toContain('bus-1');
  });

  it('404s on an unknown token', async () => {
    orderRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.track('nope')).rejects.toThrow(NotFoundException);
  });

  it('reports QR ordering closed during a rush pause', async () => {
    branchRepo.findOne.mockResolvedValueOnce({
      id: 'br-1',
      name: 'Wuse 2',
      businessId: 'bus-1',
    });
    businessRepo.findOne.mockResolvedValueOnce({
      name: 'Urban Grill',
      posSettings: {
        rushPause: true,
        serviceChargeEnabled: true,
        serviceChargeRate: 5,
      },
    });
    const info = await service.orderingInfo('br-1');
    expect(info.acceptingOrders).toBe(false);
    expect(info.pricing.serviceChargeRate).toBe(5);
  });
});
