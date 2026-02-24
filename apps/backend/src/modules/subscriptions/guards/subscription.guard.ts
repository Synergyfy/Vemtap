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

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionsService: SubscriptionsService,
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

    // If no user is authenticated (and not public), let AuthGuard handle it.
    // If we are here, likely AuthGuard has passed or we are in a permissive mode.
    // But usually this guard runs after AuthGuard.
    if (!user) {
      return true;
    }

    // Admins bypass subscription checks
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check business subscription
    if (user.businessId) {
      const status = await this.subscriptionsService.getSubscriptionStatus(
        user.businessId,
      );

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
