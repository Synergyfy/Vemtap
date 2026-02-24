import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions.service';
import { SubscriptionStatus } from '../entities/subscription.entity';

@Injectable()
export class TrialRestrictionGuard implements CanActivate {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.businessId) {
      return true;
    }

    const sub = await this.subscriptionsService.activeSubscription(
      user.businessId,
    );

    if (sub && sub.status === SubscriptionStatus.TRIAL) {
      throw new ForbiddenException(
        'Messaging features are disabled during trial period.',
      );
    }

    return true;
  }
}
