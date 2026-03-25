import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AdministrationService } from './administration.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class CustomerImpersonationGuard implements CanActivate {
  constructor(private readonly adminService: AdministrationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tokenStr = request.headers['x-customer-impersonation-token'];

    if (!tokenStr) return true; // No customer impersonation, proceed normally

    const token = await this.adminService.validateCustomerToken(tokenStr);

    // Actor must be the one who generated the token
    const actor = request.user;
    if (!actor || actor.id !== token.actorId) {
      throw new ForbiddenException('You are not the actor for this customer impersonation token');
    }

    // Only Admin/Agent can use this
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.AGENT) {
      throw new ForbiddenException('Only admins and agents can perform customer impersonation');
    }

    // Fetch the target customer
    const customer = token.targetCustomer;
    if (!customer || customer.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Target is not a valid customer');
    }

    // Stash the original actor for audit logging
    request.originalActor = actor;

    // Override request.user to be the customer — now all CUSTOMER-gated endpoints work
    request.user = customer;
    request.isCustomerImpersonated = true;
    request.customerImpersonationToken = token;

    return true;
  }
}
