import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SupportBotService } from './support-bot.service';
import { BotContextService } from './bot-context.service';
import {
  SupportKnowledge,
  BotInteraction,
} from './entities/support-bot.entity';
import { Repository } from 'typeorm';

describe('SupportBotService', () => {
  let service: SupportBotService;
  let knowledgeRepo: Repository<SupportKnowledge>;
  let interactionRepo: Repository<BotInteraction>;

  const mockKnowledge = [
    {
      id: '1',
      question: 'how to top up',
      answer: 'Hi {{name}}, you have {{smsCredits}} credits.',
      keywords: ['topup', 'credits'],
      isActive: true,
      link: '/billing',
    },
  ];

  const mockUserContext = {
    name: 'Azeem',
    businessName: 'VemTap Test',
    credits: { sms: 100, email: 500, whatsapp: 50 },
    openTickets: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportBotService,
        {
          provide: BotContextService,
          useValue: {
            getUserContext: jest.fn().mockResolvedValue(mockUserContext),
          },
        },
        {
          provide: getRepositoryToken(SupportKnowledge),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn().mockResolvedValue(mockKnowledge),
            increment: jest.fn(),
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest
              .fn()
              .mockImplementation((dto) =>
                Promise.resolve({ id: 'new-id', ...dto }),
              ),
          },
        },
        {
          provide: getRepositoryToken(BotInteraction),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest
              .fn()
              .mockImplementation((dto) =>
                Promise.resolve({ id: 'int-id', ...dto }),
              ),
          },
        },
      ],
    }).compile();

    service = module.get<SupportBotService>(SupportBotService);
    knowledgeRepo = module.get<Repository<SupportKnowledge>>(
      getRepositoryToken(SupportKnowledge),
    );
    interactionRepo = module.get<Repository<BotInteraction>>(
      getRepositoryToken(BotInteraction),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleQuery - Context Awareness', () => {
    it('should parse templates with user context', async () => {
      jest
        .spyOn(knowledgeRepo, 'findOne')
        .mockResolvedValue(mockKnowledge[0] as any);

      const result = await service.handleQuery('user-1', {
        query: 'how to top up',
      });

      expect(result.id).toBe('int-id');
      expect(result.content).toContain('Hi Azeem');
      expect(result.content).toContain('you have 100 credits');
      expect(result.content).toContain('🔗 [Click here to go there](/billing)');
      expect(result.source).toBe('rule');
    });
  });

  describe('handleQuery - Keyword Matching Normalization', () => {
    it('should match even with punctuation', async () => {
      jest.spyOn(knowledgeRepo, 'findOne').mockResolvedValue(null);

      const result = await service.handleQuery('user-1', {
        query: 'Credits??',
      });

      expect(result.content).toContain('Hi Azeem');
      expect(result.source).toBe('rule');
    });
  });

  describe('updateInteraction', () => {
    it('should update the helpfulness of an interaction', async () => {
      const mockInteraction = { id: 'int-1', wasHelpful: false };
      jest
        .spyOn(interactionRepo, 'findOne')
        .mockResolvedValue(mockInteraction as any);
      jest
        .spyOn(interactionRepo, 'save')
        .mockImplementation((dto) => Promise.resolve(dto as any));

      await service.updateInteraction('int-1', true);

      expect(interactionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ wasHelpful: true }),
      );
    });
  });
});
