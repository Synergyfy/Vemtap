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
    const isImpersonated = !!impersonationTokenStr;
    const isAdminOrAgent = user && (user.role === UserRole.ADMIN || user.role === UserRole.AGENT);

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

          if (impersonationTokenStr) {
            const token = await this.adminService.validateToken(impersonationTokenStr);
            actorId = token.actorId;
            branchId = token.targetBranchId;
            businessId = token.targetBranch?.businessId;
            impersonationTokenId = token.id;
          }

          if (actorId) {
            await this.adminService.logAction({
              actorId,
              businessId,
              branchId,
              module,
              method,
              endpoint: url,
              payload: method !== 'GET' ? body : null,
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

  private determineModule(url: string): BackendModule {
    if (url.includes('/loyalty')) return BackendModule.LOYALTY;
    if (url.includes('/visitors')) return BackendModule.VISITORS;
    if (url.includes('/support') || url.includes('/tickets')) return BackendModule.TICKETS;
    if (url.includes('/messaging') || url.includes('/campaigns')) return BackendModule.MESSAGING;
    if (url.includes('/payments')) return BackendModule.PAYMENTS;
    if (url.includes('/settings')) return BackendModule.SETTINGS;
    if (url.includes('/branches')) return BackendModule.BRANCHES;
    if (url.includes('/businesses')) return BackendModule.BUSINESSES;
    if (url.includes('/analytics') || url.includes('/reports')) return BackendModule.REPORTS;
    
    return BackendModule.ALL; // Default or fallback
  }
}
