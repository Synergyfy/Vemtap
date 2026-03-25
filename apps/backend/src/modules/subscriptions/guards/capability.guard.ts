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

    let businessId = user?.businessId;

    if (!businessId) {
      const branchId =
        user?.branchId || request.body?.branchId || request.query?.branchId;

      if (!branchId) {
        throw new ForbiddenException(
          'Branch or Business context is required for capability check',
        );
      }
      businessId = await this.branchesService.getBusinessId(branchId);
    }

    // Security: Ensure users (except Admin) can only check capabilities for their own business
    if (
      user.role !== 'Admin' &&
      user.businessId &&
      businessId !== user.businessId
    ) {
      throw new ForbiddenException(
        'You do not have permission to check capabilities for this business',
      );
    }

    const capabilitiesData =
      await this.subscriptionsService.getCapabilities(businessId);

    const feature = capabilitiesData.capabilities[requiredCapability];
    if (!feature) {
      throw new ForbiddenException(`Unknown capability ${requiredCapability}`);
    }

    if (feature.enabled === false) {
      throw new ForbiddenException(
        `The ${requiredCapability} feature is not included in your current plan.`,
      );
    }

    if (
      feature.limit !== undefined &&
      feature.limit !== 'unlimited' &&
      feature.remaining <= 0
    ) {
      throw new ForbiddenException(
        `You have reached the limit for ${requiredCapability} on your current plan.`,
      );
    }

    return true;
  }
}
