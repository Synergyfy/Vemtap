import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FosAiAssistantService } from './fos-ai-assistant.service';
import { FinancialTransaction } from '../fos-core/entities/financial-transaction.entity';

describe('FosAiAssistantService', () => {
  let service: FosAiAssistantService;

  const mockTransactionRepo = {
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FosAiAssistantService,
        {
          provide: getRepositoryToken(FinancialTransaction),
          useValue: mockTransactionRepo,
        },
      ],
    }).compile();

    service = module.get<FosAiAssistantService>(FosAiAssistantService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return insights and predefined questions', async () => {
    mockTransactionRepo.find.mockResolvedValue([
      {
        type: 'SUBSCRIPTION',
        amount: '1000000',
        profit: '500000',
        cost: '0',
        date: '2026-07-01',
      },
      {
        type: 'SMS',
        amount: '500000',
        profit: '250000',
        cost: '100000',
        date: '2026-07-02',
      },
      {
        type: 'EXPENSE',
        amount: '200000',
        profit: '0',
        cost: '200000',
        date: '2026-07-03',
      },
    ]);

    const result = await service.getInsights();
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.predefinedQuestions).toContain(
      'What is our break-even point?',
    );
  });

  it('should answer a hire-affordability question with data rows', async () => {
    mockTransactionRepo.find.mockResolvedValue([
      {
        type: 'SUBSCRIPTION',
        amount: '1000000',
        profit: '500000',
        cost: '0',
        date: '2026-07-01',
      },
      {
        type: 'SMS',
        amount: '500000',
        profit: '250000',
        cost: '100000',
        date: '2026-07-02',
      },
      {
        type: 'COMMISSION',
        amount: '50000',
        profit: '0',
        cost: '50000',
        date: '2026-07-03',
      },
    ]);

    const result = await service.chat('Can we afford to hire a developer?');
    expect(result.answer).toContain('developer');
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('should answer a break-even question', async () => {
    mockTransactionRepo.find.mockResolvedValue([
      {
        type: 'SUBSCRIPTION',
        amount: '1000000',
        profit: '500000',
        cost: '0',
        date: '2026-07-01',
      },
      {
        type: 'SMS',
        amount: '500000',
        profit: '250000',
        cost: '100000',
        date: '2026-07-02',
      },
      {
        type: 'EXPENSE',
        amount: '200000',
        profit: '0',
        cost: '200000',
        date: '2026-07-03',
      },
    ]);

    const result = await service.chat('What is our break-even point?');
    expect(result.answer.toLowerCase()).toContain('break even');
  });

  it('should return a default answer for unknown questions', async () => {
    mockTransactionRepo.find.mockResolvedValue([]);
    const result = await service.chat('something random');
    expect(result.data.length).toBeGreaterThan(0);
  });
});
