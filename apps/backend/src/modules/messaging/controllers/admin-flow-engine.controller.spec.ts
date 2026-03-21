import { Test, TestingModule } from '@nestjs/testing';
import { AdminFlowEngineController } from './admin-flow-engine.controller';
import { AdminFlowEngineService } from '../services/admin-flow-engine.service';
import { FlowTemplate } from '../entities/flow-template.entity';
import { FlowTriggerConfig } from '../entities/flow-trigger-config.entity';
import {
  CreateFlowTemplateDto,
  UpdateFlowTemplateDto,
  UpdateFlowTriggerConfigDto,
} from '../dto/flow-engine.dto';
import { FlowAnalyticsResponse } from '../interfaces/flow-engine.interface';
import { Setting } from '../../settings/entities/setting.entity';
import { UpdateSettingDto } from '../../settings/dto/update-setting.dto';

describe('AdminFlowEngineController', () => {
  let controller: AdminFlowEngineController;
  let service: jest.Mocked<AdminFlowEngineService>;

  beforeEach(async () => {
    const mockService = {
      getTemplates: jest.fn(),
      createTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      deleteTemplate: jest.fn(),
      getTriggers: jest.fn(),
      updateTrigger: jest.fn(),
      getSessions: jest.fn(),
      getLogs: jest.fn(),
      getAnalytics: jest.fn(),
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminFlowEngineController],
      providers: [
        {
          provide: AdminFlowEngineService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AdminFlowEngineController>(
      AdminFlowEngineController,
    );
    service = module.get(AdminFlowEngineService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTemplates', () => {
    it('should return an array of templates', async () => {
      const result: FlowTemplate[] = [];
      service.getTemplates.mockResolvedValue(result);
      expect(await controller.getTemplates()).toBe(result);
    });
  });

  describe('createTemplate', () => {
    it('should create a template', async () => {
      const dto: CreateFlowTemplateDto = {
        name: 'Test',
        triggerType: 'test',
        structure: { nodes: [], edges: [] },
      };
      const result: FlowTemplate = { id: '1', ...dto } as any;
      service.createTemplate.mockResolvedValue(result);
      expect(await controller.createTemplate(dto)).toBe(result);
    });
  });

  describe('updateTemplate', () => {
    it('should update a template', async () => {
      const dto: UpdateFlowTemplateDto = { name: 'Updated' };
      const result: FlowTemplate = { id: '1', name: 'Updated' } as any;
      service.updateTemplate.mockResolvedValue(result);
      expect(await controller.updateTemplate('1', dto)).toBe(result);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      service.deleteTemplate.mockResolvedValue({} as any);
      await controller.deleteTemplate('1');
      expect(service.deleteTemplate).toHaveBeenCalledWith('1');
    });
  });

  describe('getTriggers', () => {
    it('should return triggers', async () => {
      const result: FlowTriggerConfig[] = [];
      service.getTriggers.mockResolvedValue(result);
      expect(await controller.getTriggers()).toBe(result);
    });
  });

  describe('updateTrigger', () => {
    it('should update a trigger', async () => {
      const dto: UpdateFlowTriggerConfigDto = { enabled: false };
      const result: FlowTriggerConfig = { key: 'test', enabled: false } as any;
      service.updateTrigger.mockResolvedValue(result);
      expect(await controller.updateTrigger('test', dto)).toBe(result);
    });
  });

  describe('getSessions', () => {
    it('should return sessions', async () => {
      const result: any[] = [];
      service.getSessions.mockResolvedValue(result);
      expect(await controller.getSessions({})).toBe(result);
    });
  });

  describe('getLogs', () => {
    it('should return logs', async () => {
      const result: any[] = [];
      service.getLogs.mockResolvedValue(result);
      expect(await controller.getLogs({})).toBe(result);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics', async () => {
      const result: FlowAnalyticsResponse = {
        totalMessagesSent: 100,
        totalRepliesReceived: 40,
        avgResponseRate: 40,
        loyaltyAssigned: 10,
        activeSessionsCount: 5,
      };
      service.getAnalytics.mockResolvedValue(result);
      expect(await controller.getAnalytics({})).toBe(result);
    });
  });

  describe('getSettings', () => {
    it('should return settings', async () => {
      const result: Setting = { platformName: 'VemTap' } as any;
      service.getSettings.mockResolvedValue(result);
      expect(await controller.getSettings()).toBe(result);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      const dto: UpdateSettingDto = { platformName: 'New Name' };
      const result: Setting = { platformName: 'New Name' } as any;
      service.updateSettings.mockResolvedValue(result);
      expect(await controller.updateSettings(dto)).toBe(result);
    });
  });
});
