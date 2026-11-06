import { NotFoundException } from '@nestjs/common';
import { PosSettingsService } from './pos-settings.service';

describe('PosSettingsService', () => {
  const businessRepo = {
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const sessionRepo = { count: jest.fn().mockResolvedValue(2) };
  const service = new PosSettingsService(
    businessRepo as never,
    sessionRepo as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns defaults for a business that never saved settings', async () => {
    businessRepo.findOne.mockResolvedValueOnce({
      id: 'bus-1',
      posSettings: null,
    });
    const settings = await service.get('bus-1');
    expect(settings.taxLabel).toBe('VAT');
    expect(settings.receiptWidth).toBe(80);
  });

  it('404s for an unknown business', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.get('nope')).rejects.toThrow(NotFoundException);
  });

  it('merges nested objects instead of replacing them', async () => {
    businessRepo.findOne.mockResolvedValueOnce({
      id: 'bus-1',
      posSettings: {
        taxRate: 5,
        permissions: { refundRequiresPin: true, discountMaxPercent: 10 },
        tenderRails: {
          transfer: { bankName: 'Wema Bank', accountNumber: '0123456789' },
        },
      },
    });

    await service.update('bus-1', {
      permissions: { voidRequiresPin: true },
      tenderRails: { transfer: { accountName: 'Urban Grill Ltd' } },
    });

    expect(businessRepo.update).toHaveBeenCalledWith(
      { id: 'bus-1' },
      {
        posSettings: {
          taxRate: 5,
          permissions: {
            refundRequiresPin: true,
            discountMaxPercent: 10,
            voidRequiresPin: true,
          },
          tenderRails: {
            transfer: {
              bankName: 'Wema Bank',
              accountNumber: '0123456789',
              accountName: 'Urban Grill Ltd',
            },
            houseTab: undefined,
          },
        },
      },
    );
  });

  it('ignores fields a DTO instance carries as undefined', async () => {
    businessRepo.findOne.mockResolvedValueOnce({
      id: 'bus-1',
      posSettings: {
        taxEnabled: true,
        taxRate: 7.5,
        tenderRails: { cash: false },
      },
    });

    const result = await service.update('bus-1', {
      taxLabel: 'VAT',
      taxEnabled: undefined,
      tenderRails: { card: true, cash: undefined, transfer: undefined },
    });

    expect(businessRepo.update).toHaveBeenCalledWith(
      { id: 'bus-1' },
      {
        posSettings: {
          taxEnabled: true,
          taxRate: 7.5,
          taxLabel: 'VAT',
          tenderRails: {
            cash: false,
            card: true,
            transfer: undefined,
            houseTab: undefined,
          },
        },
      },
    );
    expect(result.taxEnabled).toBe(true);
    expect(result.tenderRails?.transfer?.enabled).toBe(true);
  });

  it('summarises labels, open sessions and the counts passed in', async () => {
    businessRepo.findOne.mockResolvedValueOnce({
      id: 'bus-1',
      posSettings: {
        taxEnabled: true,
        taxRate: 7.5,
        permissions: { refundRequiresPin: true },
      },
    });
    const summary = await service.summary('bus-1', {
      tillCount: 3,
      peripheralCount: 5,
      staffPinCount: 2,
    });
    expect(summary).toMatchObject({
      taxLabel: 'VAT 7.5%',
      serviceChargeLabel: null,
      activeCashiers: 2,
      tillCount: 3,
      supervisorPinRequired: true,
    });
  });
});
