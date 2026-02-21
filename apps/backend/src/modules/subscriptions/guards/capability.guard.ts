import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class CapabilityGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private subscriptionsService: SubscriptionsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredCapability = this.reflector.get<string>('capability', context.getHandler());
        if (!requiredCapability) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        // Assuming businessId is either in body, params, or decoded user
        const businessId = request.body?.businessId || request.params?.businessId || request.user?.businessId;

        if (!businessId) {
            throw new ForbiddenException('Business ID is required for capability check');
        }

        const capabilitiesData = await this.subscriptionsService.getCapabilities(businessId);

        // Format is capabilities.[feature] e.g. teamMembers, tags
        const feature = capabilitiesData.capabilities[requiredCapability];
        if (!feature) {
            throw new ForbiddenException(`Unknown capability ${requiredCapability}`);
        }

        if (feature.limit !== 'unlimited' && feature.remaining <= 0) {
            throw new ForbiddenException(`You have reached the limit for ${requiredCapability} on your current plan.`);
        }

        return true;
    }
}
