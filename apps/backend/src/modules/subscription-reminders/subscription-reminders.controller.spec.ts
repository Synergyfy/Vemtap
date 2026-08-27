import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionRemindersController } from './subscription-reminders.controller';
import { SubscriptionRemindersService } from './subscription-reminders.service';

describe('SubscriptionRemindersController', () => {
  let controller: SubscriptionRemindersController;
  let service: any;

  const mockTemplate = {
    id: 'tmpl-1',
    stage: 14,
    name: '14-Day Expiry Reminder',
    titleTemplate: 'Your deals in {{clusterName}} expire in {{daysLeft}} days',
    messageTemplate: '{{people}} shoppers checked deals in {{clusterName}}',
    isEnabled: true,
  };

  beforeEach(async () => {
    service = {
      getPlaceholders: jest.fn().mockResolvedValue([{ placeholder: '{{clusterName}}' }]),
      getTemplates: jest.fn().mockResolvedValue([mockTemplate]),
      getTemplateById: jest.fn().mockResolvedValue(mockTemplate),
      createTemplate: jest.fn().mockResolvedValue(mockTemplate),
      updateTemplate: jest.fn().mockResolvedValue(mockTemplate),
      resetTemplate: jest.fn().mockResolvedValue(mockTemplate),
      previewTemplate: jest.fn().mockResolvedValue({
        title: 'Rendered Title',
        message: 'Rendered Message',
      }),
      runRenewalReminders: jest.fn().mockResolvedValue({
        expiring: 1,
        lapsed: 0,
        sentInApp: 1,
        sentPush: 1,
        sentEmail: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionRemindersController],
      providers: [{ provide: SubscriptionRemindersService, useValue: service }],
    }).compile();

    controller = module.get<SubscriptionRemindersController>(
      SubscriptionRemindersController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get placeholders', async () => {
    const result = await controller.getPlaceholders();
    expect(result).toBeDefined();
    expect(service.getPlaceholders).toHaveBeenCalled();
  });

  it('should get all templates', async () => {
    const result = await controller.getTemplates();
    expect(result).toHaveLength(1);
    expect(service.getTemplates).toHaveBeenCalled();
  });

  it('should get template by ID', async () => {
    const result = await controller.getTemplateById('tmpl-1');
    expect(result).toEqual(mockTemplate);
    expect(service.getTemplateById).toHaveBeenCalledWith('tmpl-1');
  });

  it('should create template', async () => {
    const dto = {
      stage: 21,
      name: '21-Day Advance',
      titleTemplate: 'Title',
      messageTemplate: 'Msg',
    };
    const result = await controller.createTemplate(dto);
    expect(result).toBeDefined();
    expect(service.createTemplate).toHaveBeenCalledWith(dto);
  });

  it('should update template', async () => {
    const dto = { name: 'Updated Name' };
    const result = await controller.updateTemplate('tmpl-1', dto);
    expect(result).toBeDefined();
    expect(service.updateTemplate).toHaveBeenCalledWith('tmpl-1', dto);
  });

  it('should reset template', async () => {
    const result = await controller.resetTemplate('tmpl-1');
    expect(result).toBeDefined();
    expect(service.resetTemplate).toHaveBeenCalledWith('tmpl-1');
  });

  it('should preview template', async () => {
    const dto = { titleTemplate: 'Title', messageTemplate: 'Msg' };
    const result = await controller.previewTemplate(dto);
    expect(result.title).toBe('Rendered Title');
    expect(service.previewTemplate).toHaveBeenCalledWith(dto);
  });

  it('should trigger manual reminder run', async () => {
    const result = await controller.runRemindersNow();
    expect(result.message).toContain('processed successfully');
    expect(service.runRenewalReminders).toHaveBeenCalled();
  });
});
