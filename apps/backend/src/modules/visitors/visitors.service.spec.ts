import { Test, TestingModule } from '@nestjs/testing';
import { VisitorsService } from './visitors.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Visit } from './entities/visit.entity';
import { Device } from '../devices/entities/device.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { MessagingEngineService } from '../messaging/services/messaging-engine.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { AutomationService } from '../messaging/services/automation.service';
import { MailService } from '../mail/mail.service';
import { DataSource } from 'typeorm';
import { BranchesService } from '../branches/branches.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

describe('VisitorsService', () => {
  let service: VisitorsService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue({ count: 0 }),
    clone: jest.fn().mockReturnThis(),
  };

  const mockUserRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn().mockImplementation((d) => d),
    save: jest
      .fn()
      .mockImplementation((d) => Promise.resolve({ id: '1', ...d })),
    softDelete: jest.fn(),
    update: jest.fn(),
  };

  const mockVisitRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    create: jest.fn().mockImplementation((d) => d),
    save: jest
      .fn()
      .mockImplementation((d) => Promise.resolve({ id: '1', ...d })),
    count: jest.fn().mockResolvedValue(0),
    find: jest.fn(),
  };

  const mockDeviceRepo = { findOne: jest.fn(), save: jest.fn() };
  const mockBranchRepo = { findOne: jest.fn() };
  const mockContactRepo = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((d) => d),
    save: jest
      .fn()
      .mockImplementation((d) => Promise.resolve({ id: '1', ...d })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitorsService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Visit), useValue: mockVisitRepo },
        { provide: getRepositoryToken(Device), useValue: mockDeviceRepo },
        { provide: getRepositoryToken(Branch), useValue: mockBranchRepo },
        { provide: getRepositoryToken(Contact), useValue: mockContactRepo },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn() },
        },
        {
          provide: MessagingEngineService,
          useValue: { sendMessage: jest.fn() },
        },
        {
          provide: CampaignsService,
          useValue: {
            getRewards: jest.fn(),
            getLoyaltyRule: jest.fn(),
            findActiveRule: jest.fn(),
          },
        },
        {
          provide: AutomationService,
          useValue: { trigger: jest.fn() },
        },
        {
          provide: MailService,
          useValue: { sendWelcomeEmail: jest.fn() },
        },
        {
          provide: BranchesService,
          useValue: {
            getBusinessId: jest.fn().mockResolvedValue('bus-1'),
            checkBranchAccess: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: LoyaltyService,
          useValue: {
            getBusinessPoints: jest.fn().mockResolvedValue(0),
            createReward: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VisitorsService>(VisitorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVisitedBranches', () => {
    it('should return paginated visited branches for a customer', async () => {
      const mockRawData = [
        {
          id: 'branch-1',
          name: 'Main Branch',
          address: '123 St',
          city: 'Lagos',
          logoUrl: 'logo.png',
          businessId: 'bus-1',
          lastVisitedAt: new Date().toISOString(),
          visitCount: '5',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValueOnce(mockRawData);
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ count: '1' });

      const result = await service.getVisitedBranches('customer-1', {
        page: 1,
        limit: 10,
        search: 'Main',
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].name).toBe('Main Branch');
      expect(result.data[0].visitCount).toBe(5);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'visit.customerId = :customerId',
        { customerId: 'customer-1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'branch.name ILIKE :search',
        { search: '%Main%' },
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated visitors', async () => {
      const mockUsers = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          visits: [{ createdAt: new Date() }],
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([
        [{ id: '1' }],
        1,
      ]);
      mockQueryBuilder.getMany.mockResolvedValueOnce(mockUsers);

      const result = await service.findAll({ page: 1, limit: 10 }, 'branch-1');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].firstName).toBe('John');
      expect(result.data[0].lastName).toBe('Doe');
    });
  });

  describe('create', () => {
    it('should create a new visitor (user + visit) if user does not exist', async () => {
      const dto = {
        firstName: 'New',
        lastName: 'Guy',
        email: 'new@example.com',
        phone: '123',
      };
      const branchId = 'branch-1';

      mockUserRepo.findOne.mockResolvedValueOnce(null); // find by email
      mockUserRepo.findOne.mockResolvedValueOnce(null); // find by phone
      mockBranchRepo.findOne.mockResolvedValueOnce({ id: branchId });

      const savedUser = {
        id: 'u1',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'Guy',
        phone: '123',
      };
      mockUserRepo.create.mockReturnValueOnce(savedUser);
      mockUserRepo.save.mockResolvedValueOnce(savedUser);

      const savedVisit = {
        id: 'v1',
        customer: savedUser,
        branchId,
        createdAt: new Date(),
      };
      mockVisitRepo.create.mockReturnValueOnce(savedVisit);
      mockVisitRepo.save.mockResolvedValueOnce(savedVisit);

      mockUserRepo.findOne.mockResolvedValueOnce({
        ...savedUser,
        visits: [savedVisit],
      });

      const result = await service.create(dto, branchId);

      expect(mockUserRepo.create).toHaveBeenCalled();
      expect(result.firstName).toBe('New');
      expect(result.lastName).toBe('Guy');
      expect(result.visits).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return stats with trends', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(100);

      const result = await service.getStats('branch-1');

      expect(result.stats).toHaveLength(4);
      expect(result.stats[0].label).toBe('Total Visitors');
      expect(result.stats[0].value).toBe('100');
    });
  });
});
