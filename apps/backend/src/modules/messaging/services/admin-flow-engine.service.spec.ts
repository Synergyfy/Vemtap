import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminFlowEngineService } from './admin-flow-engine.service';
import { FlowTemplate } from '../entities/flow-template.entity';
import { FlowTriggerConfig } from '../entities/flow-trigger-config.entity';
import { FlowLog } from '../entities/flow-log.entity';
import { FlowExecution } from '../entities/flow-execution.entity';
import { SettingsService } from '../../settings/settings.service';

describe('AdminFlowEngineService', () => {
  let service: AdminFlowEngineService;
  let templateRepo: jest.Mocked<Repository<FlowTemplate>>;
  let triggerRepo: jest.Mocked<Repository<FlowTriggerConfig>>;
  let logRepo: jest.Mocked<Repository<FlowLog>>;
  let executionRepo: jest.Mocked<Repository<FlowExecution>>;
  let settingsService: jest.Mocked<SettingsService>;

  beforeEach(async () => {
    const mockRepo = () => ({
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminFlowEngineService,
        {
          provide: getRepositoryToken(FlowTemplate),
          useValue: mockRepo(),
        },
        {
          provide: getRepositoryToken(FlowTriggerConfig),
          useValue: mockRepo(),
        },
        {
          provide: getRepositoryToken(FlowLog),
          useValue: mockRepo(),
        },
        {
          provide: getRepositoryToken(FlowExecution),
          useValue: mockRepo(),
        },
        {
          provide: SettingsService,
          useValue: {
            getGlobalSettings: jest.fn(),
            updateSettings: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminFlowEngineService>(AdminFlowEngineService);
    templateRepo = module.get(getRepositoryToken(FlowTemplate));
    triggerRepo = module.get(getRepositoryToken(FlowTriggerConfig));
    logRepo = module.get(getRepositoryToken(FlowLog));
    executionRepo = module.get(getRepositoryToken(FlowExecution));
    settingsService = module.get(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTemplates', () => {
    it('should return templates', async () => {
      const templates = [{ name: 'Template 1' }];
      templateRepo.find.mockResolvedValue(templates);
      expect(await service.getTemplates()).toEqual(templates);
    });
  });

  describe('getTriggers', () => {
    it('should return triggers', async () => {
      const triggers = [{ key: 'new_customer' }];
      triggerRepo.find.mockResolvedValue(triggers);
      expect(await service.getTriggers()).toEqual(triggers);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics summary', async () => {
      logRepo.count.mockResolvedValue(100);
      executionRepo.count.mockResolvedValue(10);
      const analytics = await service.getAnalytics({});
      expect(analytics.totalMessagesSent).toBe(100);
      expect(analytics.activeSessionsCount).toBe(10);
    });
  });
});
