import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions.service';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { SKIP_SUBSCRIPTION_CHECK_KEY } from '../decorators/skip-subscription-check.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { SubscriptionStatus } from '../entities/subscription.entity';
import { BranchesService } from '../../branches/branches.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly branchesService: BranchesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const skipSubscriptionCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_SUBSCRIPTION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipSubscriptionCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true;
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    if (user.branchId) {
      const businessId = await this.branchesService.getBusinessId(
        user.branchId,
      );
      const status =
        await this.subscriptionsService.getSubscriptionStatus(businessId);

      if (
        status === SubscriptionStatus.EXPIRED ||
        status === SubscriptionStatus.CANCELED
      ) {
        throw new ForbiddenException(
          'Subscription expired. Please renew to continue.',
        );
      }
    }

    return true;
  }
}
