import { TrialRestrictionGuard } from './trial-restriction.guard';
import { SubscriptionsService } from '../subscriptions.service';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionStatus } from '../entities/subscription.entity';

describe('TrialRestrictionGuard', () => {
  let guard: TrialRestrictionGuard;
  let subscriptionsService: SubscriptionsService;

  const mockSubscriptionsService = {
    activeSubscription: jest.fn(),
  };

  const mockContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: { businessId: 'b1' },
      }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new TrialRestrictionGuard(mockSubscriptionsService as any);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw ForbiddenException if subscription is TRIAL', async () => {
    mockSubscriptionsService.activeSubscription.mockResolvedValue({
      status: SubscriptionStatus.TRIAL,
    });

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should return true if subscription is ACTIVE', async () => {
    mockSubscriptionsService.activeSubscription.mockResolvedValue({
      status: SubscriptionStatus.ACTIVE,
    });

    expect(await guard.canActivate(mockContext)).toBe(true);
  });

  it('should return true if no subscription', async () => {
    mockSubscriptionsService.activeSubscription.mockResolvedValue(null);
    expect(await guard.canActivate(mockContext)).toBe(true);
  });
});
