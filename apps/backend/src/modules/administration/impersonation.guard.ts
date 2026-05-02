import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AdministrationService } from './administration.service';
import { BackendModule } from '../../common/enums/backend-module.enum';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class ImpersonationGuard implements CanActivate {
  constructor(private readonly adminService: AdministrationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tokenStr = request.headers['x-impersonation-token'];

    if (!tokenStr) {
      return true; // No impersonation token, proceed with normal auth
    }

    const token = await this.adminService.validateToken(tokenStr);

    // Check if the actor has permission for this module
    const user = request.user;
    if (!user) return false;

    // The user must be the actor of the token
    if (user.id !== token.actorId) {
      throw new ForbiddenException(
        'You are not the actor for this impersonation token',
      );
    }

    // Determine module context (you can use reflectors or URL patterns)
    // For now, check if the agent has permissions for this specific branch context
    // and if they have the required module permissions.

    const requiredModule = this.getModuleFromUrl(request.url);

    if (user.role !== UserRole.ADMIN) {
      // Agents must have explicit module permissions
      const permissions = user.permissions || [];
      if (
        !permissions.includes(BackendModule.ALL) &&
        !permissions.includes(requiredModule)
      ) {
        throw new ForbiddenException(
          `You do not have permission for the ${requiredModule} module`,
        );
      }
    }

    // Override branchId and businessId in request for downstream logic
    request.user.branchId = token.targetBranchId;
    request.user.businessId =
      token.targetBranch?.business?.id ?? token.targetBranch.businessId;

    // Also tag the request as impersonated
    request.isImpersonated = true;
    request.impersonationToken = token;

    return true;
  }

  private getModuleFromUrl(url: string): BackendModule {
    if (url.includes('/loyalty')) return BackendModule.LOYALTY;
    if (url.includes('/visitors') || url.includes('/contacts'))
      return BackendModule.VISITORS;
    if (url.includes('/support') || url.includes('/tickets'))
      return BackendModule.TICKETS;
    if (url.includes('/messaging') || url.includes('/campaigns'))
      return BackendModule.MESSAGING;
    if (url.includes('/payments')) return BackendModule.PAYMENTS;
    if (
      url.includes('/settings') ||
      url.includes('/forms') ||
      url.includes('/users') ||
      url.includes('/devices')
    )
      return BackendModule.SETTINGS;
    if (url.includes('/branches')) return BackendModule.BRANCHES;
    if (url.includes('/businesses')) return BackendModule.BUSINESSES;
    if (url.includes('/analytics') || url.includes('/reports'))
      return BackendModule.REPORTS;

    return BackendModule.ALL;
  }
}
