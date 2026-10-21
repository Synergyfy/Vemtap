import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsService } from './campaigns.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { BranchesService } from '../branches/branches.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
});
