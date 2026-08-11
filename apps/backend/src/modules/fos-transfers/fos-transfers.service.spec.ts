import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FosTransfersService } from './fos-transfers.service';
import { FosTransfer } from './entities/transfer.entity';

describe('FosTransfersService', () => {
  let service: FosTransfersService;

  const mockTransferRepo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((obj: object) => ({ ...obj })),
    save: jest.fn((row: object) => Promise.resolve({ ...row })),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FosTransfersService,
        {
          provide: getRepositoryToken(FosTransfer),
          useValue: mockTransferRepo,
        },
      ],
    }).compile();

    service = module.get<FosTransfersService>(FosTransfersService);
  });

  describe('list', () => {
    it('should return transfers and total', async () => {
      mockTransferRepo.findAndCount.mockResolvedValue([
        [
          {
            id: 'xfr-1',
            date: '2026-07-15',
            type: 'Transfer',
            category: 'Internal Transfer',
            description: 'Operating → Reserve',
            amount: '500000',
            reference: 'XFR-2026-001',
          },
        ],
        1,
      ]);

      const result = await service.list({});

      expect(result.total).toBe(1);
      expect(result.transfers[0].type).toBe('Transfer');
      expect(result.transfers[0].amount).toBe(500000);
    });
  });

  describe('create', () => {
    it('should force type to Transfer', async () => {
      const result = await service.create({
        date: '2026-07-15',
        description: 'Operating → Reserve',
        amount: 500000,
      });

      expect(result.type).toBe('Transfer');
    });
  });

  describe('remove', () => {
    it('should throw when missing', async () => {
      mockTransferRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toThrow(NotFoundException);
    });
  });
});
