import { Test, TestingModule } from '@nestjs/testing';
import { BusinessesService } from './businesses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Business,
  BusinessStatus,
  BusinessType,
} from './entities/business.entity';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { MailService } from '../mail/mail.service';
import { NotFoundException } from '@nestjs/common';

describe('BusinessesService', () => {
  let service: BusinessesService;
  let repository: any;

  const mockBusiness = {
    id: 'biz-1',
    name: 'Original Name',
    ownerId: 'owner-1',
    save: jest.fn(),
  };

  const mockRepository = {
    findOneBy: jest.fn().mockResolvedValue(mockBusiness),
    create: jest
      .fn()
      .mockImplementation((dto) => ({ ...dto, save: jest.fn() })),
    save: jest.fn().mockImplementation((biz) => Promise.resolve(biz)),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ avgSeconds: 0 }),
      getCount: jest.fn().mockResolvedValue(0),
    })),
    count: jest.fn().mockResolvedValue(0),
    remove: jest.fn(),
  };

  const mockUsersRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockBranchRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((branch) =>
        Promise.resolve({ id: 'branch-1', ...branch }),
      ),
    find: jest.fn().mockResolvedValue([]),
  };

  const mockVisitRepository = {
    count: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockResolvedValue([]),
  };

  const mockMailService = {
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesService,
        {
          provide: getRepositoryToken(Business),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: mockBranchRepository,
        },
        {
          provide: getRepositoryToken(Visit),
          useValue: mockVisitRepository,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<BusinessesService>(BusinessesService);
    repository = module.get(getRepositoryToken(Business));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should update business name', async () => {
      const updateDto = {
        name: 'Updated Name',
      };

      const result = await service.update('biz-1', updateDto);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'biz-1' });
      expect(result.name).toBe(updateDto.name);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if business not found', async () => {
      repository.findOneBy.mockResolvedValue(null);
      await expect(service.update('invalid-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
