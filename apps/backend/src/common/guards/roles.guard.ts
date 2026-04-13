import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
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
      .getRequest<{ user: User; headers: any }>();
    const user = request.user;
    const userRole = this.normalizeRole(user?.role);

    // If the user is an Admin or Agent and has an impersonation token,
    // we allow them past the initial role check. The ImpersonationGuard
    // will further validate their specific module permissions.
    const isImpersonating = !!(request as any).isImpersonated;
    if (
      isImpersonating &&
      (user?.role === UserRole.ADMIN || user?.role === UserRole.AGENT)
    ) {
      return true;
    }

    return requiredRoles.some(
      (role) => this.normalizeRole(String(role)) === userRole,
    );
  }
}
