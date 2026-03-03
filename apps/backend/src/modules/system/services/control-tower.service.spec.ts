import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ControlTowerService } from './control-tower.service';
import { Business, BusinessStatus } from '../../businesses/entities/business.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { User } from '../../users/entities/user.entity';
import {
  BusinessSudoActionDto,
  CustomerSudoActionDto,
} from '../dto/control-tower.dto';

describe('ControlTowerService', () => {
  let service: ControlTowerService;
  let businessRepo: jest.Mocked<Repository<Business>>;
  let contactRepo: jest.Mocked<Repository<Contact>>;
  let userRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const mockRepo = () => ({
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ControlTowerService,
        {
          provide: getRepositoryToken(Business),
          useValue: mockRepo(),
        },
        {
          provide: getRepositoryToken(Contact),
          useValue: mockRepo(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo(),
        },
      ],
    }).compile();

    service = module.get<ControlTowerService>(ControlTowerService);
    businessRepo = module.get(getRepositoryToken(Business));
    contactRepo = module.get(getRepositoryToken(Contact));
    userRepo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchBusinesses', () => {
    it('should return mapped business control records', async () => {
      const mockBusiness = {
        id: 'biz_1',
        name: 'Test Biz',
        status: BusinessStatus.ACTIVE,
        owner: { firstName: 'John', lastName: 'Doe' },
        staff: [],
      } as any;
      businessRepo.find.mockResolvedValue([mockBusiness]);

      const result = await service.searchBusinesses({ query: 'Test' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Biz');
      expect(result[0].owner).toBe('John Doe');
    });
  });

  describe('executeBusinessSudoAction - pause', () => {
    it('should suspend a business', async () => {
      const mockBusiness = { id: 'biz_1', name: 'Test Biz', status: BusinessStatus.ACTIVE } as any;
      businessRepo.findOne.mockResolvedValue(mockBusiness);
      businessRepo.save.mockResolvedValue({ ...mockBusiness, status: BusinessStatus.SUSPENDED });

      const dto: BusinessSudoActionDto = {
        businessUid: 'biz_1',
        actionKey: 'pause',
        ticketRef: 'TKT-123',
      };

      const result = await service.executeBusinessSudoAction(dto);
      expect(result.success).toBe(true);
      expect(mockBusiness.status).toBe(BusinessStatus.SUSPENDED);
    });
  });

  describe('executeCustomerSudoAction - award_points', () => {
    it('should return success for awarding points', async () => {
      const mockContact = { id: 'cus_1', name: 'John' } as any;
      contactRepo.findOne.mockResolvedValue(mockContact);

      const dto: CustomerSudoActionDto = {
        customerUid: 'cus_1',
        businessUid: 'biz_1',
        actionKey: 'award_points',
        payload: { points: 100 },
      };

      const result = await service.executeCustomerSudoAction(dto);
      expect(result.success).toBe(true);
    });
  });
});
