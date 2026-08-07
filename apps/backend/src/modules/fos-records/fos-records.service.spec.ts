import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FosRecordsService } from './fos-records.service';
import { FosRecord } from './entities/record.entity';

describe('FosRecordsService', () => {
  let service: FosRecordsService;

  const mockRecordRepo = {
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
        FosRecordsService,
        { provide: getRepositoryToken(FosRecord), useValue: mockRecordRepo },
      ],
    }).compile();

    service = module.get<FosRecordsService>(FosRecordsService);
  });

  describe('list', () => {
    it('should return records and total', async () => {
      const rows = [
        {
          id: 'r1',
          date: '2026-07-18',
          type: 'Income',
          category: 'Service Revenue',
          description: 'Consulting',
          amount: '250000',
        },
      ];
      mockRecordRepo.findAndCount.mockResolvedValue([rows, 1]);

      const result = await service.list({});

      expect(result.total).toBe(1);
      expect(result.records[0].amount).toBe(250000);
    });
  });

  describe('remove', () => {
    it('should throw when missing', async () => {
      mockRecordRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toThrow(NotFoundException);
    });
  });
});
