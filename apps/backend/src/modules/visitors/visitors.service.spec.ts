import { Test, TestingModule } from '@nestjs/testing';
import { VisitorsService } from './visitors.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Visit } from './entities/visit.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';

describe('VisitorsService', () => {
  let service: VisitorsService;
  let userRepository: Repository<User>;
  let visitRepository: Repository<Visit>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
    getCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitorsService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Visit),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VisitorsService>(VisitorsService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    visitRepository = module.get<Repository<Visit>>(getRepositoryToken(Visit));
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

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: '1' }], 1]);
      mockQueryBuilder.getMany.mockResolvedValue(mockUsers);

      const result = await service.findAll({ page: 1, limit: 10 }, 'biz-1');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].name).toBe('John Doe');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'visit.businessId = :businessId',
        { businessId: 'biz-1' },
      );
    });
  });

  describe('create', () => {
    it('should create a new visitor (user + visit) if user does not exist', async () => {
      const dto = { name: 'New Guy', email: 'new@example.com', phone: '123' };
      const businessId = 'biz-1';

      (userRepository.findOne as jest.Mock).mockResolvedValueOnce(null); // First check: not found

      const savedUser = {
        id: 'u1',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'Guy',
        phone: '123',
      };
      (userRepository.create as jest.Mock).mockReturnValue(savedUser);
      (userRepository.save as jest.Mock).mockResolvedValue(savedUser);

      const savedVisit = { id: 'v1', customer: savedUser, businessId };
      (visitRepository.create as jest.Mock).mockReturnValue(savedVisit);
      (visitRepository.save as jest.Mock).mockResolvedValue(savedVisit);

      // Re-fetch returns user with visits
      (userRepository.findOne as jest.Mock).mockResolvedValueOnce({
        ...savedUser,
        visits: [savedVisit],
      });

      const result = await service.create(dto, businessId);

      expect(userRepository.create).toHaveBeenCalled();
      expect(visitRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('New Guy');
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
