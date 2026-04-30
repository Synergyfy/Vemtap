import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AdministrationService } from './administration.service';
import { BackendModule } from '../../common/enums/backend-module.enum';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly adminService: AdministrationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, ip, user, headers } = request;
    const impersonationTokenStr = headers['x-impersonation-token'];

    // Only log state-changing requests or impersonated requests
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const isCustomerImpersonated =
      !!request.headers['x-customer-impersonation-token'];
    const isImpersonated = !!impersonationTokenStr || isCustomerImpersonated;
    const isAdminOrAgent =
      user && (user.role === UserRole.ADMIN || user.role === UserRole.AGENT);

    // LOG: Mutations by anyone, OR any request (including GET) by Admin/Agent if impersonating
    if (!isMutation && !isImpersonated) {
      return next.handle();
    }

    // Additional check: If it's a GET, only log if it's an Admin/Agent impersonating
    if (method === 'GET' && !isImpersonated) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          const statusCode = context.switchToHttp().getResponse().statusCode;

          // Determine module from URL or custom decorator (simplified for now)
          const module = this.determineModule(url);

          // We need the branchId/businessId context which might be in the request or from token validation
          // If impersonated, the AdministrationService can provide context
          let businessId = user?.businessId;
          let branchId = user?.branchId;
          let actorId = user?.id;
          let impersonationTokenId: string | undefined = undefined;

          const impersonationToken = request.impersonationToken;
          const customerImpersonationToken = request.customerImpersonationToken;

          if (impersonationToken) {
            actorId = impersonationToken.actorId;
            branchId = impersonationToken.targetBranchId;
            businessId =
              impersonationToken.targetBranch?.business?.id ??
              impersonationToken.targetBranch.businessId;
            impersonationTokenId = impersonationToken.id;
          } else if (customerImpersonationToken) {
            actorId = customerImpersonationToken.actorId;
            branchId = customerImpersonationToken.targetBranchId;
            // The branch might not have the business loaded on the customer token,
            // but we can try to fall back to the original actor's context if present,
            // or leave businessId empty if not strictly needed here.
            businessId = request.originalActor?.businessId;
            impersonationTokenId = customerImpersonationToken.id;
          }

          if (actorId) {
            await this.adminService.logAction({
              actorId,
              businessId,
              branchId,
              module,
              method,
              endpoint: url,
              payload: method !== 'GET' ? this.sanitisePayload(body) : null,
              statusCode,
              ipAddress: ip,
              userAgent: headers['user-agent'],
              impersonationTokenId,
            });
          }
        } catch (error) {
          console.error('Audit Log Error:', error);
          // Don't fail the request if logging fails
        }
      }),
    );
  }

  private sanitisePayload(
    body: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!body || typeof body !== 'object') return body;
    const sanitised = { ...body };
    const SENSITIVE_KEYS = [
      'password',
      'currentPassword',
      'newPassword',
      'pin',
      'cardNumber',
    ];
    for (const key of SENSITIVE_KEYS) {
      if (key in sanitised) sanitised[key] = '[REDACTED]';
    }
    return sanitised;
  }

  private determineModule(url: string): BackendModule {
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

    return BackendModule.ALL; // Default or fallback
  }
}
