import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionGuard } from './subscription.guard';
import { SubscriptionsService } from '../subscriptions.service';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';
import { SubscriptionStatus } from '../entities/subscription.entity';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;
  let subscriptionsService: SubscriptionsService;
  let reflector: Reflector;

  const mockSubscriptionsService = {
    getSubscriptionStatus: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({}),
    }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionGuard,
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<SubscriptionGuard>(SubscriptionGuard);
    subscriptionsService =
      module.get<SubscriptionsService>(SubscriptionsService);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow if @Public()', async () => {
    mockReflector.getAllAndOverride.mockReturnValueOnce(true); // isPublic
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should allow if @SkipSubscriptionCheck()', async () => {
    mockReflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
    mockReflector.getAllAndOverride.mockReturnValueOnce(true); // skipSubscriptionCheck
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should allow if no user', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: null }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow if user is ADMIN', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: UserRole.ADMIN },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow if subscription is ACTIVE', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockSubscriptionsService.getSubscriptionStatus.mockResolvedValue(
      SubscriptionStatus.ACTIVE,
    );

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: UserRole.OWNER, businessId: 'b1' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw Forbidden if subscription is EXPIRED', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockSubscriptionsService.getSubscriptionStatus.mockResolvedValue(
      SubscriptionStatus.EXPIRED,
    );

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: UserRole.OWNER, businessId: 'b1' },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
