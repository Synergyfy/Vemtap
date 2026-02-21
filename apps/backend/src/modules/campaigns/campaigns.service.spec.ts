import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsService } from './campaigns.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import { Repository } from 'typeorm';
import { CampaignType, CampaignStatus } from './dto/create-campaign.dto';

const mockCampaignRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
});

const mockTemplateRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

import { ObjectLiteral } from 'typeorm';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('CampaignsService', () => {
  let service: CampaignsService;
  let campaignRepository: MockRepository<Campaign>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: getRepositoryToken(Campaign),
          useFactory: mockCampaignRepository,
        },
        {
          provide: getRepositoryToken(CampaignTemplate),
          useFactory: mockTemplateRepository,
        },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
    campaignRepository = module.get<MockRepository<Campaign>>(
      getRepositoryToken(Campaign),
    );
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
      const businessId = 'biz-123';
      const expectedCampaign = {
        ...createDto,
        businessId,
        id: '1',
        sent: 0,
        delivered: '0%',
        clicks: 0,
        status: CampaignStatus.DRAFT,
      };

      campaignRepository.create!.mockReturnValue(expectedCampaign);
      campaignRepository.save!.mockResolvedValue(expectedCampaign);

      const result = await service.create(createDto, businessId);
      expect(result).toEqual(expectedCampaign);
      expect(campaignRepository.create).toHaveBeenCalledWith({
        ...createDto,
        businessId,
      });
      expect(campaignRepository.save).toHaveBeenCalled();
    });
  });
});
