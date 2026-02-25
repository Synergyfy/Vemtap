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
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
    getRawMany: jest.fn().mockResolvedValue([]),
  };

  const mockUserRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn().mockImplementation(d => d),
    save: jest.fn().mockImplementation(d => Promise.resolve({ id: '1', ...d })),
    softDelete: jest.fn(),
  };

  const mockVisitRepo = {
    create: jest.fn().mockImplementation(d => d),
    save: jest.fn().mockImplementation(d => Promise.resolve({ id: '1', ...d })),
    count: jest.fn().mockResolvedValue(0),
  };

  const mockDeviceRepo = { findOne: jest.fn() };
  const mockBranchRepo = { findOne: jest.fn() };
  const mockContactRepo = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation(d => d),
    save: jest.fn().mockImplementation(d => Promise.resolve({ id: '1', ...d })),
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
          provide: MessagingEngineService,
          useValue: { sendMessage: jest.fn() },
        },
        {
          provide: CampaignsService,
          useValue: { getRewards: jest.fn(), getLoyaltyRule: jest.fn() },
        },
        {
          provide: AutomationService,
          useValue: { trigger: jest.fn() },
        },
        {
          provide: MailService,
          useValue: { sendWelcomeEmail: jest.fn() },
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

      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([[{ id: '1' }], 1]);
      mockQueryBuilder.getMany.mockResolvedValueOnce(mockUsers);

      const result = await service.findAll({ page: 1, limit: 10 }, 'biz-1');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].name).toBe('John Doe');
    });
  });

  describe('create', () => {
    it('should create a new visitor (user + visit) if user does not exist', async () => {
      const dto = { name: 'New Guy', email: 'new@example.com', phone: '123' };
      const businessId = 'biz-1';

      mockUserRepo.findOne.mockResolvedValueOnce(null); // First check: user not found

      const savedUser = {
        id: 'u1',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'Guy',
        phone: '123',
      };
      mockUserRepo.create.mockReturnValueOnce(savedUser);
      mockUserRepo.save.mockResolvedValueOnce(savedUser);

      const savedVisit = { id: 'v1', customer: savedUser, businessId, createdAt: new Date() };
      mockVisitRepo.create.mockReturnValueOnce(savedVisit);
      mockVisitRepo.save.mockResolvedValueOnce(savedVisit);

      // Re-fetch returns user with visits
      mockUserRepo.findOne.mockResolvedValueOnce({
        ...savedUser,
        visits: [savedVisit],
      });

      const result = await service.create(dto, businessId);

      expect(mockUserRepo.create).toHaveBeenCalled();
      expect(result.name).toBe('New Guy');
      expect(result.visits).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return stats with trends', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(100);

      const result = await service.getStats('biz-1');

      expect(result.stats).toHaveLength(4);
      expect(result.stats[0].label).toBe('Total Visitors');
      expect(result.stats[0].value).toBe('100');
    });
  });
});
