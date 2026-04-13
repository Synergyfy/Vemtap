import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions.service';
import { SubscriptionStatus } from '../entities/subscription.entity';
import { BranchesService } from '../../branches/branches.service';

@Injectable()
export class TrialRestrictionGuard implements CanActivate {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly branchesService: BranchesService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.branchId) {
      return true;
    }

    // const businessId = await this.branchesService.getBusinessId(user.branchId);
    // const sub = await this.subscriptionsService.activeSubscription(businessId);

    // if (sub && sub.status === SubscriptionStatus.TRIAL) {
    //   throw new ForbiddenException(
    //     'Messaging features are disabled during trial period.',
    //   );
    // }

    return true;
  }
}
