import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountPrivacyService } from './account-privacy.service';

export type ProcessingPurpose = 'ai' | 'analytics';

const PROCESSING_PURPOSE = 'processingPurpose';

/**
 * Marks a route that processes the business's data for an optional purpose:
 * `ai` is blocked when the business restricted processing; `analytics` also
 * when it turned personalised analytics off (Business settings → Privacy).
 */
export const RequiresProcessingConsent = (purpose: ProcessingPurpose) =>
  SetMetadata(PROCESSING_PURPOSE, purpose);

@Injectable()
export class ProcessingConsentGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly privacy: AccountPrivacyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const purpose = this.reflector.get<ProcessingPurpose | undefined>(
      PROCESSING_PURPOSE,
      context.getHandler(),
    );
    if (!purpose) return true;
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { businessId?: string | null } }>();
    if (await this.privacy.allows(request.user?.businessId, purpose))
      return true;
    throw new ForbiddenException(
      purpose === 'analytics'
        ? 'AI analysis is switched off for this business (Business settings → Privacy)'
        : 'Processing is restricted for this business (Business settings → Privacy)',
    );
  }
}
