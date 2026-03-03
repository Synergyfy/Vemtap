import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsService } from './campaigns.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import { LoyaltyProfile } from './entities/loyalty-profile.entity';
import { PointTransaction } from './entities/point-transaction.entity';
import { LoyaltyRule } from './entities/loyalty-rule.entity';
import { Reward } from './entities/reward.entity';
import { Redemption } from './entities/redemption.entity';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { BranchesService } from '../branches/branches.service';
import { AutomationService } from '../messaging/services/automation.service';
import { CampaignType, CampaignStatus } from './dto/create-campaign.dto';

describe('CampaignsService', () => {
  let service: CampaignsService;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((d) => d),
    save: jest
      .fn()
      .mockImplementation((d) => Promise.resolve({ id: '1', ...d })),
    softDelete: jest.fn(),
  };

  const mockBranchesService = {
    findById: jest.fn(),
  };

  const mockAutomationService = {
    trigger: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: getRepositoryToken(Campaign), useValue: mockRepo },
        { provide: getRepositoryToken(CampaignTemplate), useValue: mockRepo },
        { provide: getRepositoryToken(LoyaltyProfile), useValue: mockRepo },
        { provide: getRepositoryToken(PointTransaction), useValue: mockRepo },
        { provide: getRepositoryToken(LoyaltyRule), useValue: mockRepo },
        { provide: getRepositoryToken(Reward), useValue: mockRepo },
        { provide: getRepositoryToken(Redemption), useValue: mockRepo },
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: getRepositoryToken(Contact), useValue: mockRepo },
        { provide: BranchesService, useValue: mockBranchesService },
        { provide: AutomationService, useValue: mockAutomationService },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new campaign', async () => {
      const createDto = {
        name: 'Test Campaign',
        type: CampaignType.WHATSAPP,
        audience: 'all',
        message: 'Hello',
      };
      const branchId = 'branch-123';
      const expectedCampaign = {
        ...createDto,
        branchId,
        id: '1',
        sent: 0,
        delivered: '0%',
        clicks: 0,
        status: CampaignStatus.DRAFT,
      };

      mockRepo.create.mockReturnValue(expectedCampaign);
      mockRepo.save.mockResolvedValue(expectedCampaign);

      const result = await service.create(createDto as any, branchId);
      expect(result).toEqual(expectedCampaign);
    });
  });
  describe('loyalty profiles', () => {
    const userId = 'user-1';
    const branchId = 'branch-1';
    const businessId = 'biz-1';
    const mockBranch = { id: branchId, businessId };

    it('getLoyaltyProfile should create profile with businessId if not exists', async () => {
      mockBranchesService.findById.mockResolvedValue(mockBranch);
      mockRepo.findOne.mockResolvedValue(null); // Profile not found

      const expectedProfile = {
        userId,
        businessId,
        branchId,
        tierLevel: 'bronze',
      };
      mockRepo.create.mockReturnValue(expectedProfile);
      mockRepo.save.mockResolvedValue({ id: 'prof-1', ...expectedProfile });

      const result = await service.getLoyaltyProfile(userId, branchId);

      expect(mockBranchesService.findById).toHaveBeenCalledWith(branchId);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { userId, businessId },
      });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ businessId }),
      );
      expect(result.businessId).toBe(businessId);
    });

    it('getLoyaltyProfile should return existing profile by businessId regardless of branch', async () => {
      mockBranchesService.findById.mockResolvedValue(mockBranch);
      const existingProfile = {
        id: 'prof-1',
        userId,
        businessId,
        branchId: 'different-branch',
      };
      mockRepo.findOne.mockResolvedValue(existingProfile);

      const result = await service.getLoyaltyProfile(userId, branchId);

      expect(result).toEqual(existingProfile);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('getLoyaltyProfile should throw NotFoundException if branch is invalid', async () => {
      mockBranchesService.findById.mockResolvedValue(null);
      await expect(
        service.getLoyaltyProfile(userId, 'invalid-branch'),
      ).rejects.toThrow('Branch not found');
    });

    it('findProfile should return profile by businessId', async () => {
      mockBranchesService.findById.mockResolvedValue(mockBranch);
      const existingProfile = { id: 'prof-1', userId, businessId };
      mockRepo.findOne.mockResolvedValue(existingProfile);

      const result = await service.findProfile(userId, branchId);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { userId, businessId },
      });
      expect(result).toEqual(existingProfile);
    });

    it('findProfile should return null if branch not found', async () => {
      mockBranchesService.findById.mockResolvedValue(null);
      const result = await service.findProfile(userId, 'invalid');
      expect(result).toBeNull();
    });
  });
});
