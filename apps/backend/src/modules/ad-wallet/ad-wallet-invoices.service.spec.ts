import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdWalletInvoicesService } from './ad-wallet-invoices.service';
import { SponsoredCampaignTransaction } from '../discovery/entities/sponsored-campaign-transaction.entity';

describe('AdWalletInvoicesService', () => {
  let service: AdWalletInvoicesService;
  let repo: { findAndCount: jest.Mock; findOne: jest.Mock };

  const invoice = {
    id: 'inv-1',
    invoiceNo: 'INV-B-ABCD1234',
    type: 'Saved card',
    amount: '10000.00',
    status: 'Paid',
    date: new Date('2026-10-14T10:00:00Z'),
    createdAt: new Date('2026-10-14T10:00:00Z'),
    campaign: { id: 'c-1', name: 'Lunch boost', kind: 'boost' },
  };

  beforeEach(async () => {
    repo = {
      findAndCount: jest.fn().mockResolvedValue([[invoice], 21]),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const module = await Test.createTestingModule({
      providers: [
        AdWalletInvoicesService,
        {
          provide: getRepositoryToken(SponsoredCampaignTransaction),
          useValue: repo,
        },
      ],
    }).compile();
    service = module.get(AdWalletInvoicesService);
  });

  it('lists only the business’s invoices, newest first', async () => {
    const page = await service.list('biz-1', 1, 20);
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { campaign: { businessId: 'biz-1' } },
        skip: 0,
        take: 20,
      }),
    );
    expect(page).toEqual({
      data: [
        {
          id: 'inv-1',
          invoiceNo: 'INV-B-ABCD1234',
          paymentMethod: 'Saved card',
          amount: 10000,
          currency: 'NGN',
          status: 'Paid',
          date: '2026-10-14T10:00:00.000Z',
          campaign: { id: 'c-1', name: 'Lunch boost', kind: 'boost' },
        },
      ],
      total: 21,
      page: 1,
      limit: 20,
      hasNextPage: true,
    });
  });

  it('returns one invoice scoped to the business, and 404s another business’s', async () => {
    await expect(service.get('biz-2', 'inv-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1', campaign: { businessId: 'biz-2' } },
      }),
    );

    repo.findOne.mockResolvedValue(invoice);
    await expect(service.get('biz-1', 'inv-1')).resolves.toMatchObject({
      invoiceNo: 'INV-B-ABCD1234',
      amount: 10000,
    });
  });
});
