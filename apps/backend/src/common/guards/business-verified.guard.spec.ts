import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { BusinessVerifiedGuard } from './business-verified.guard';
import {
  Business,
  BusinessStatus,
} from '../../modules/businesses/entities/business.entity';
import { User, UserRole } from '../../modules/users/entities/user.entity';

describe('BusinessVerifiedGuard', () => {
  let guard: BusinessVerifiedGuard;
  const mockBusinessRepository = {
    findOne: jest.fn(),
  };
  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockReflector.getAllAndOverride.mockReturnValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessVerifiedGuard,
        {
          provide: getRepositoryToken(Business),
          useValue: mockBusinessRepository,
        },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<BusinessVerifiedGuard>(BusinessVerifiedGuard);
  });

  const makeCtx = (user?: Partial<User>): ExecutionContext =>
    ({
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: user as User | undefined }),
      }),
    }) as unknown as ExecutionContext;

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow public routes through', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(makeCtx())).resolves.toBe(true);
  });

  it('should throw when no user is present', async () => {
    await expect(guard.canActivate(makeCtx(undefined))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should allow ADMIN users', async () => {
    await expect(
      guard.canActivate(makeCtx({ role: UserRole.ADMIN })),
    ).resolves.toBe(true);
  });

  it('should allow AGENT users (own KYC gate)', async () => {
    await expect(
      guard.canActivate(makeCtx({ role: UserRole.AGENT })),
    ).resolves.toBe(true);
  });

  it('should throw for OWNER without a business', async () => {
    await expect(
      guard.canActivate(makeCtx({ id: 'user-1', role: UserRole.OWNER })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should resolve business by ownerId when businessId missing (OWNER)', async () => {
    mockBusinessRepository.findOne.mockResolvedValue({
      id: 'bus-1',
      status: BusinessStatus.ACTIVE,
    });

    await expect(
      guard.canActivate(
        makeCtx({ id: 'user-1', role: UserRole.OWNER, businessId: undefined }),
      ),
    ).resolves.toBe(true);

    expect(mockBusinessRepository.findOne).toHaveBeenCalledWith({
      where: { ownerId: 'user-1' },
    });
  });

  it('should throw for a pending business', async () => {
    mockBusinessRepository.findOne.mockResolvedValue({
      id: 'bus-1',
      status: BusinessStatus.PENDING,
    });

    await expect(
      guard.canActivate(
        makeCtx({ id: 'user-1', role: UserRole.OWNER, businessId: 'bus-1' }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw for a suspended business', async () => {
    mockBusinessRepository.findOne.mockResolvedValue({
      id: 'bus-1',
      status: BusinessStatus.SUSPENDED,
    });

    await expect(
      guard.canActivate(
        makeCtx({ id: 'user-1', role: UserRole.MANAGER, businessId: 'bus-1' }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw when the business does not exist', async () => {
    mockBusinessRepository.findOne.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        makeCtx({ id: 'user-1', role: UserRole.MANAGER, businessId: 'bus-1' }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow an active business for MANAGER', async () => {
    mockBusinessRepository.findOne.mockResolvedValue({
      id: 'bus-1',
      status: BusinessStatus.ACTIVE,
    });

    await expect(
      guard.canActivate(
        makeCtx({ id: 'user-1', role: UserRole.MANAGER, businessId: 'bus-1' }),
      ),
    ).resolves.toBe(true);
  });
});
