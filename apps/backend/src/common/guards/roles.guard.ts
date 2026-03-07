import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

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
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;
    const userRole = this.normalizeRole(user?.role);
    return requiredRoles.some(
      (role) => this.normalizeRole(String(role)) === userRole,
    );
  }
}
