import { NotFoundException } from '@nestjs/common';
import { PosDisplayService } from './pos-display.service';
import { POS_SOCKET_EVENTS } from './pos.gateway';

describe('PosDisplayService', () => {
  const tillRepo = { findOne: jest.fn() };
  const saleRepo = { update: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const branchRepo = { findOne: jest.fn() };
  const cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
  const gateway = { emitToTill: jest.fn() };
  const service = new PosDisplayService(
    tillRepo as never,
    saleRepo as never,
    businessRepo as never,
    branchRepo as never,
    cache as never,
    gateway as never,
  );
  const till = {
    id: 'till-1',
    name: 'Front',
    code: 'TILL-01',
    branchId: 'br-1',
  };

  beforeEach(() => jest.clearAllMocks());

  it('prices the pushed ticket with the business settings and broadcasts it', async () => {
    tillRepo.findOne.mockResolvedValueOnce(till);
    businessRepo.findOne.mockResolvedValueOnce({
      posSettings: { taxEnabled: true, taxRate: 7.5 },
    });

    const ticket = await service.putTicket('bus-1', 'till-1', {
      lines: [{ name: 'Jollof', quantity: 2, unitPrice: 2700 }],
      discountAmount: 400,
    });

    expect(ticket).toMatchObject({
      subtotal: 5400,
      discountAmount: 400,
      tax: 375,
      total: 5375,
    });
    expect(cache.set).toHaveBeenCalledWith(
      'pos:display:till-1',
      ticket,
      expect.any(Number),
    );
    expect(gateway.emitToTill).toHaveBeenCalledWith(
      'till-1',
      POS_SOCKET_EVENTS.TICKET_UPDATED,
      expect.objectContaining({ ticket }),
    );
  });

  it('404s for a till of another business', async () => {
    tillRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.get('bus-1', 'till-x')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('announces payment when cleared with a sale', async () => {
    tillRepo.findOne.mockResolvedValueOnce(till);
    await service.clearTicket('bus-1', 'till-1', 'sale-1');
    expect(cache.del).toHaveBeenCalledWith('pos:display:till-1');
    expect(gateway.emitToTill).toHaveBeenCalledWith(
      'till-1',
      POS_SOCKET_EVENTS.PAYMENT_COMPLETED,
      { saleId: 'sale-1' },
    );
  });

  it('stores tip and rating only on a sale of this business', async () => {
    tillRepo.findOne.mockResolvedValueOnce(till);
    saleRepo.update.mockResolvedValueOnce({ affected: 0 });
    await expect(
      service.tipRating('bus-1', 'till-1', {
        saleId: 'sale-x',
        tipAmount: 500,
        rating: 5,
      }),
    ).rejects.toThrow(NotFoundException);
    expect(saleRepo.update).toHaveBeenCalledWith(
      { id: 'sale-x', businessId: 'bus-1' },
      { tipAmount: 500, rating: 5 },
    );
  });

  it('shows transfer details only when the transfer rail is on', async () => {
    tillRepo.findOne.mockResolvedValueOnce(till);
    businessRepo.findOne.mockResolvedValueOnce({
      name: 'Urban Grill',
      posSettings: {
        tenderRails: {
          transfer: {
            enabled: false,
            bankName: 'Wema',
            accountNumber: '0123456789',
          },
        },
      },
    });
    branchRepo.findOne.mockResolvedValueOnce({ name: 'Wuse 2' });
    cache.get.mockResolvedValueOnce(null);

    const state = await service.get('bus-1', 'till-1');
    expect(state.transfer).toBeNull();
    expect(state.paymentMethods.transfer).toBe(false);
    expect(state.ticket).toBeNull();
  });
});
