import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private normalizeRole(role?: string): string {
    return String(role || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context
      .switchToHttp()
      .getRequest<{ user: User; headers: any; method: string }>();
    const user = request.user;

    // AMIS / SUDO Mode Security:
    // If the user is impersonating, we check the actor's role.
    const isImpersonating = !!(request as any).isImpersonated;
    const isCustomerImpersonated = !!(request as any).isCustomerImpersonated;

    if (isImpersonating || isCustomerImpersonated) {
      const originalActor = isCustomerImpersonated
        ? (request as any).originalActor
        : user;

      // Restriction: Agents cannot perform deletions while in SUDO mode
      if (
        originalActor?.role === UserRole.AGENT &&
        request.method?.toUpperCase() === 'DELETE'
      ) {
        throw new ForbiddenException(
          'Agents are not allowed to perform deletions while impersonating.',
        );
      }

      // If business impersonation, allow Admin/Agent past the initial role check.
      // Customer impersonation continues to the normal role matching against the Customer role.
      if (
        isImpersonating &&
        (user?.role === UserRole.ADMIN || user?.role === UserRole.AGENT)
      ) {
        return true;
      }
    }

    const userRole = this.normalizeRole(user?.role);

    return requiredRoles.some(
      (role) => this.normalizeRole(String(role)) === userRole,
    );
  }
}
