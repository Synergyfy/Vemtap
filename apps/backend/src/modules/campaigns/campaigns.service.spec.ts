import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsService } from './campaigns.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { BranchesService } from '../branches/branches.service';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BusinessCustomersService } from '../business-customers/business-customers.service';
import { MessagingEngineService } from '../messaging/services/messaging-engine.service';
import { UserRole } from '../users/entities/user.entity';

describe('CampaignsService', () => {
  let service: CampaignsService;

  const mockCampaignRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((campaign) =>
        Promise.resolve({ id: 'campaign-1', ...campaign }),
      ),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    remove: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockTemplateRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((template) =>
        Promise.resolve({ id: 'template-1', ...template }),
      ),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockBusinessCustomers = {
    filterKnownCustomers: jest.fn(),
  };

  const mockMessagingEngine = {
    sendMessage: jest.fn().mockResolvedValue({ count: 2, messageIds: [] }),
  };

  const mockContactRepo = {
    findOne: jest.fn(),
  };

  const mockBranchesService = {
    findById: jest
      .fn()
      .mockResolvedValue({ id: 'branch-1', businessId: 'biz-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: getRepositoryToken(Campaign),
          useValue: mockCampaignRepository,
        },
        {
          provide: getRepositoryToken(CampaignTemplate),
          useValue: mockTemplateRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Contact),
          useValue: mockContactRepo,
        },
        {
          provide: BranchesService,
          useValue: mockBranchesService,
        },
        { provide: BusinessCustomersService, useValue: mockBusinessCustomers },
        { provide: MessagingEngineService, useValue: mockMessagingEngine },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const owner = { id: 'u1', role: UserRole.OWNER, businessId: 'biz-1' } as any;

  describe('create', () => {
    it('should create a campaign', async () => {
      const dto = {
        name: 'Holiday Special',
        type: 'SMS' as any,
        audience: 'all',
        message: 'Hi!',
      };
      const branchId = 'branch-1';
      const result = await service.create(dto, branchId, owner);
      expect(result).toBeDefined();
      expect(result.id).toBe('campaign-1');
      expect(mockBranchesService.findById).toHaveBeenCalledWith(branchId);
      expect(mockCampaignRepository.save).toHaveBeenCalled();
    });

    it("should refuse another business's branch", async () => {
      const dto = {
        name: 'X',
        type: 'SMS' as any,
        audience: 'all',
        message: 'Hi',
      };
      await expect(
        service.create(dto, 'branch-1', { ...owner, businessId: 'biz-2' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should always scope an owner to their own business', async () => {
      await service.findAll(owner, 'branch-9');
      expect(mockCampaignRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { businessId: 'biz-1', branchId: 'branch-9' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if campaign not found', async () => {
      mockCampaignRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('invalid', 'biz-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should look the campaign up within the business', async () => {
      const campaign = { id: 'c1', name: 'Test' };
      mockCampaignRepository.findOne.mockResolvedValue(campaign);
      const result = await service.findOne('c1', 'biz-1');
      expect(result).toEqual(campaign);
      expect(mockCampaignRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'c1', businessId: 'biz-1' },
      });
    });
  });

  describe('send', () => {
    const draft = {
      id: 'c1',
      type: 'SMS',
      status: 'Draft',
      message: 'Hi',
      branchId: 'branch-1',
      businessId: 'biz-1',
      subject: null,
    };

    beforeEach(() => {
      mockCampaignRepository.findOne.mockResolvedValue({ ...draft });
      mockCampaignRepository.update.mockClear();
      mockMessagingEngine.sendMessage.mockClear();
      mockBusinessCustomers.filterKnownCustomers.mockResolvedValue([
        'u1',
        'u2',
        'u3',
      ]);
      mockUserRepo.find.mockResolvedValue([
        { id: 'u1', optOut: false, optInChannels: null },
        { id: 'u2', optOut: true, optInChannels: null },
        { id: 'u3', optOut: false, optInChannels: ['EMAIL'] },
      ]);
    });

    it('sends only to customers who accept the channel', async () => {
      await service.send('c1', 'biz-1', {
        customerIds: ['u1', 'u2', 'u3', 'x'],
      });
      expect(mockBusinessCustomers.filterKnownCustomers).toHaveBeenCalledWith(
        'biz-1',
        ['u1', 'u2', 'u3', 'x'],
      );
      expect(mockMessagingEngine.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ channel: 'SMS', customerIds: ['u1'] }),
      );
      expect(mockCampaignRepository.update).toHaveBeenLastCalledWith(
        'c1',
        expect.objectContaining({ status: 'Completed', sent: 2 }),
      );
    });

    it('keeps a future campaign scheduled with its recipients', async () => {
      mockCampaignRepository.findOne.mockResolvedValue({
        ...draft,
        scheduledFor: new Date(Date.now() + 3_600_000),
      });
      await service.send('c1', 'biz-1', { customerIds: ['u1'] });
      expect(mockMessagingEngine.sendMessage).not.toHaveBeenCalled();
      expect(mockCampaignRepository.update).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ status: 'Scheduled', recipientIds: ['u1'] }),
      );
    });

    it('refuses a campaign that was already sent', async () => {
      mockCampaignRepository.findOne.mockResolvedValue({
        ...draft,
        status: 'Completed',
      });
      await expect(
        service.send('c1', 'biz-1', { customerIds: ['u1'] }),
      ).rejects.toThrow(ConflictException);
    });

    it('puts the status back when the engine fails', async () => {
      mockMessagingEngine.sendMessage.mockRejectedValueOnce(
        new Error('Insufficient SMS credits'),
      );
      await expect(
        service.send('c1', 'biz-1', { customerIds: ['u1'] }),
      ).rejects.toThrow('Insufficient SMS credits');
      expect(mockCampaignRepository.update).toHaveBeenLastCalledWith('c1', {
        status: 'Draft',
      });
    });
  });
});
