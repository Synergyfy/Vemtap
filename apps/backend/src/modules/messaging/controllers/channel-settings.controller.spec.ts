import { Test, TestingModule } from '@nestjs/testing';
import { ChannelSettingsController } from './channel-settings.controller';
import { ChannelSettingsService } from '../services/channel-settings.service';
import { MessagingHelperService } from '../services/messaging-helper.service';
import { User, UserRole } from '../../users/entities/user.entity';
import { UpdateChannelSettingsDto } from '../dto/update-channel-settings.dto';
import { SmsRoutingMode } from '../entities/messaging-channel-setting.entity';
import { BadRequestException } from '@nestjs/common';

describe('ChannelSettingsController', () => {
  let controller: ChannelSettingsController;
  let service: ChannelSettingsService;
  let messagingHelper: MessagingHelperService;

  const mockChannelSettingsService = {
    getChannelSettings: jest.fn(),
    updateChannelSettings: jest.fn(),
  };

  const mockMessagingHelperService = {
    resolveBranchId: jest.fn((user, branchId) =>
      Promise.resolve(branchId || 'branch-1'),
    ),
  };

  const mockUser = {
    id: 'user-1',
    businessId: 'biz-100',
    role: UserRole.OWNER,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelSettingsController],
      providers: [
        {
          provide: ChannelSettingsService,
          useValue: mockChannelSettingsService,
        },
        {
          provide: MessagingHelperService,
          useValue: mockMessagingHelperService,
        },
      ],
    }).compile();

    controller = module.get<ChannelSettingsController>(
      ChannelSettingsController,
    );
    service = module.get<ChannelSettingsService>(ChannelSettingsService);
    messagingHelper = module.get<MessagingHelperService>(
      MessagingHelperService,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getChannelSettings', () => {
    it('should throw BadRequestException if user has no businessId', async () => {
      const userNoBiz = { id: 'user-2' } as User;
      await expect(
        controller.getChannelSettings({ user: userNoBiz }, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should retrieve settings for user business', async () => {
      mockChannelSettingsService.getChannelSettings.mockResolvedValue({
        smsSenderId: 'VemTap',
        smsRouting: SmsRoutingMode.AFRICA_OPTIMIZED,
      });

      const res = await controller.getChannelSettings({ user: mockUser }, {});
      expect(service.getChannelSettings).toHaveBeenCalledWith(
        'biz-100',
        undefined,
      );
      expect(res).toEqual({
        smsSenderId: 'VemTap',
        smsRouting: SmsRoutingMode.AFRICA_OPTIMIZED,
      });
    });
  });

  describe('updateChannelSettings', () => {
    it('should update channel settings successfully', async () => {
      const dto: UpdateChannelSettingsDto = {
        smsSenderId: 'MyStore',
        smsRouting: SmsRoutingMode.GLOBAL_FASTEST,
      };

      mockChannelSettingsService.updateChannelSettings.mockResolvedValue({
        businessId: 'biz-100',
        smsSenderId: 'MyStore',
        smsRouting: SmsRoutingMode.GLOBAL_FASTEST,
      });

      const res = await controller.updateChannelSettings(
        { user: mockUser },
        dto,
      );
      expect(service.updateChannelSettings).toHaveBeenCalledWith(
        'biz-100',
        dto,
      );
      expect(res.smsSenderId).toBe('MyStore');
    });
  });

  describe('generateDnsRecords', () => {
    it('should generate DNS records for email domain', async () => {
      mockChannelSettingsService.updateChannelSettings.mockResolvedValue({
        businessId: 'biz-100',
        emailCustomDomain: 'mybrand.com',
        emailDomainStatus: 'verifying',
      });

      const res = await controller.generateDnsRecords(
        { user: mockUser },
        { domain: 'mybrand.com' },
      );

      expect(service.updateChannelSettings).toHaveBeenCalledWith('biz-100', {
        branchId: undefined,
        emailCustomDomain: 'mybrand.com',
        generateDnsRecords: true,
      });
      expect(res.emailCustomDomain).toBe('mybrand.com');
    });
  });
});
