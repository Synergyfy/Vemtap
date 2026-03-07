import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions.service';
import { BranchesService } from '../../branches/branches.service';

@Injectable()
export class CapabilityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
    private branchesService: BranchesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredCapability = this.reflector.get<string>(
      'capability',
      context.getHandler(),
    );
    if (!requiredCapability) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const branchId =
      user?.branchId || request.body?.branchId || request.query?.branchId;

    if (!branchId) {
      throw new ForbiddenException(
        'Branch context is required for capability check',
      );
    }

    const businessId = await this.branchesService.getBusinessId(branchId);

    const capabilitiesData =
      await this.subscriptionsService.getCapabilities(businessId);

    const feature = capabilitiesData.capabilities[requiredCapability];
    if (!feature) {
      throw new ForbiddenException(`Unknown capability ${requiredCapability}`);
    }

    if (feature.limit !== 'unlimited' && feature.remaining <= 0) {
      throw new ForbiddenException(
        `You have reached the limit for ${requiredCapability} on your current plan.`,
      );
    }

    return true;
  }
}
