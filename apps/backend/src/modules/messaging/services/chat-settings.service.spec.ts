import { Test, TestingModule } from '@nestjs/testing';
import { ChatSettingsService } from './chat-settings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AutomationRule } from '../entities/automation-rule.entity';
import { ChatCategory } from '../entities/chat-category.entity';
import { TriggerType } from '../enums/automation.enum';

describe('ChatSettingsService', () => {
  let service: ChatSettingsService;
  let automationRepo: any;
  let categoryRepo: any;

  beforeEach(async () => {
    automationRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation(dto => dto),
      save: jest.fn().mockImplementation(rule => Promise.resolve({ id: 'rule-1', ...rule })),
      remove: jest.fn(),
    };
    categoryRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation(dto => dto),
      save: jest.fn().mockImplementation(cat => Promise.resolve({ id: 'cat-1', ...cat })),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatSettingsService,
        {
          provide: getRepositoryToken(AutomationRule),
          useValue: automationRepo,
        },
        {
          provide: getRepositoryToken(ChatCategory),
          useValue: categoryRepo,
        },
      ],
    }).compile();

    service = module.get<ChatSettingsService>(ChatSettingsService);
  });

  describe('getAutomatedReplies', () => {
    it('should return formatted automation settings', async () => {
      automationRepo.find.mockResolvedValue([
        { triggerType: TriggerType.WELCOME_MESSAGE, isActive: true, actionConfig: { message: 'Welcome!' } },
      ]);

      const result = await service.getAutomatedReplies('branch-1');
      expect(result.welcomeEnabled).toBe(true);
      expect(result.welcomeMessage).toBe('Welcome!');
      expect(result.offHoursEnabled).toBe(false);
    });
  });

  describe('upsertRule', () => {
    it('should create a new rule if none exists', async () => {
      automationRepo.findOne.mockResolvedValue(null);
      
      const result = await service.updateAutomatedReplies('branch-1', { welcomeEnabled: true, welcomeMessage: 'Hello' });
      
      expect(automationRepo.create).toHaveBeenCalled();
      expect(automationRepo.save).toHaveBeenCalled();
    });
  });

  describe('Categories', () => {
    it('should get all categories for a branch', async () => {
      const mockCats = [{ id: '1', name: 'Support' }];
      categoryRepo.find.mockResolvedValue(mockCats);

      const result = await service.getCategories('branch-1');
      expect(result).toEqual(mockCats);
      expect(categoryRepo.find).toHaveBeenCalledWith({ where: { branchId: 'branch-1' } });
    });

    it('should create a new category', async () => {
      const dto = { name: 'Technical Support', routeTo: 'Tech Team' };
      const result = await service.createCategory('branch-1', dto);
      
      expect(categoryRepo.create).toHaveBeenCalled();
      expect(categoryRepo.save).toHaveBeenCalled();
      expect(result.slug).toBe('technical-support');
    });
  });
});
