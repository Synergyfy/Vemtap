import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, UserStatus } from '../../modules/users/entities/user.entity';

@Injectable()
export class UserStatusGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;

    if (user && user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Your account has been suspended. Please contact support.',
      );
    }

    return true;
  }
}
