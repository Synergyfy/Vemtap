import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/users/entities/user.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        // Owners and Admins bypass permission checks
        if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
            return true;
        }

        // Check if user has ALL of the required permissions for this endpoint
        // (Or we could do SOME, but usually permissions are granular)
        const userPermissions = user.permissions || [];
        return requiredPermissions.every((permission) => userPermissions.includes(permission));
    }
}
