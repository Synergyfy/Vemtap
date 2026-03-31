import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, UserRole, UserStatus } from '../../modules/users/entities/user.entity';

@Injectable()
export class UserStatusGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      'excess_stock_audit_sector_13_community_non_profit_public_services',
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const isAllowPending = this.reflector.getAllAndOverride<boolean>(
      'isAllowPending',
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;

    if (user && user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Your account has been suspended. Please contact support.',
      );
    }

    // Customer password change requirement removed as per request
    /*
    if (
      user &&
      user.role === UserRole.CUSTOMER &&
      user.status === UserStatus.PENDING &&
      !isAllowPending
    ) {
      throw new ForbiddenException(
        'Please change your default password to access your dashboard.',
      );
    }
    */

    return true;
  }
}
