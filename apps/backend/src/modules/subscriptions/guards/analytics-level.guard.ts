import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class AnalyticsLevelGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredLevel = this.reflector.get<string>(
      'analyticsLevel',
      context.getHandler(),
    );
    if (!requiredLevel) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const businessId = user?.businessId;
    if (!businessId) {
      // If we don't have business context, we can't check level
      return true;
    }

    // Security check: Only Admins can view other business analytics
    if (user.role !== 'Admin' && user.businessId && businessId !== user.businessId) {
        throw new ForbiddenException('You do not have permission to access analytics for this business');
    }

    const capabilitiesData =
      await this.subscriptionsService.getCapabilities(businessId);
    const userLevel = capabilitiesData.capabilities.analytics;

    if (userLevel === 'none') {
      throw new ForbiddenException(
        'Analytics features are not included in your current plan.',
      );
    }

    if (requiredLevel === 'advanced' && userLevel === 'basic') {
      throw new ForbiddenException(
        'This analytics feature requires an Advanced plan.',
      );
    }

    return true;
  }
}
