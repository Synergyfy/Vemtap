import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SkipSubscriptionCheck } from '../subscriptions/decorators/skip-subscription-check.decorator';
import { VerificationService } from './verification.service';
import {
  AdminVerificationDecisionDto,
  ManualReviewDto,
  StartLivenessDto,
  UnregisteredBusinessDto,
  VerifyBusinessDto,
  VerifyIdentityDto,
} from './dto/verify.dto';
import { verifyBytidSignature } from './verification-rules';
import type { BytidWebhookEvent } from './bytid/bytid.types';

interface AuthedRequest {
  user: { id: string; businessId?: string | null; role: UserRole };
}

function businessOf(req: AuthedRequest): string {
  if (!req.user?.businessId) {
    throw new BadRequestException('Business context required for verification');
  }
  return req.user.businessId;
}

@ApiTags('Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@SkipSubscriptionCheck()
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('status')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary:
      'Business verification status and the latest identity / business checks',
  })
  status(@Req() req: AuthedRequest) {
    return this.verificationService.status(businessOf(req));
  }

  @Post('liveness-sessions')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('verification')
  @ApiOperation({
    summary:
      'Start a selfie (liveness) check; open `url` and come back to submit the ID',
  })
  startLiveness(@Req() req: AuthedRequest, @Body() dto: StartLivenessDto) {
    return this.verificationService.startLiveness(
      businessOf(req),
      dto.redirectUrl,
    );
  }

  @Post('identity')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('verification')
  @ApiOperation({
    summary:
      "Verify the account holder: NIN, driver's licence or voter's card (registry + selfie), or passport (document + selfie)",
  })
  verifyIdentity(@Req() req: AuthedRequest, @Body() dto: VerifyIdentityDto) {
    return this.verificationService.verifyIdentity(
      businessOf(req),
      req.user.id,
      dto,
    );
  }

  @Post('business')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('verification')
  @ApiOperation({
    summary: 'Verify a CAC-registered business (RC / BN / IT number)',
  })
  verifyBusiness(@Req() req: AuthedRequest, @Body() dto: VerifyBusinessDto) {
    return this.verificationService.verifyBusiness(
      businessOf(req),
      req.user.id,
      dto,
    );
  }

  @Post('business/unregistered')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('verification')
  @ApiOperation({
    summary: 'Submit a business without CAC registration for review',
  })
  submitUnregistered(
    @Req() req: AuthedRequest,
    @Body() dto: UnregisteredBusinessDto,
  ) {
    return this.verificationService.submitUnregistered(
      businessOf(req),
      req.user.id,
      dto,
    );
  }

  @Post('manual-review')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('verification')
  @ApiOperation({
    summary: 'Ask a person at VEMTAP to review a check that did not pass',
  })
  requestManualReview(@Req() req: AuthedRequest, @Body() dto: ManualReviewDto) {
    return this.verificationService.requestManualReview(businessOf(req), dto);
  }

  @Get('admin/:businessId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: every verification check of a business, with evidence',
  })
  adminDetail(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.verificationService.adminDetail(businessId);
  }

  @Post('admin/:businessId/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: verify the business and pass checks awaiting review',
  })
  approve(
    @Req() req: AuthedRequest,
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: AdminVerificationDecisionDto,
  ) {
    return this.verificationService.adminDecide(
      businessId,
      req.user.id,
      'approve',
      dto.note,
    );
  }

  @Post('admin/:businessId/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: reject verification (the owner can try again)',
  })
  reject(
    @Req() req: AuthedRequest,
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: AdminVerificationDecisionDto,
  ) {
    return this.verificationService.adminDecide(
      businessId,
      req.user.id,
      'reject',
      dto.note,
    );
  }
}

/** Signed callbacks from bytID. Public; trust comes from the signature. */
@ApiTags('Verification')
@Controller('verification/webhooks')
export class VerificationWebhookController {
  private readonly logger = new Logger(VerificationWebhookController.name);

  constructor(
    private readonly verificationService: VerificationService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @SkipSubscriptionCheck()
  @Post('bytid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'bytID webhook (Bytid-Signature HMAC)' })
  async bytid(
    @Body() event: BytidWebhookEvent,
    @Headers('bytid-signature') signature: string | undefined,
    @Req() req: { rawBody?: Buffer },
  ) {
    const secret = this.config.get<string>('BYTID_WEBHOOK_SECRET') ?? '';
    if (!req.rawBody || !verifyBytidSignature(signature, req.rawBody, secret)) {
      throw new UnauthorizedException('Invalid signature');
    }
    // Always 2xx once the signature is good, or bytID keeps retrying.
    await this.verificationService
      .handleWebhook(event)
      .catch((err: Error) =>
        this.logger.error(`bytID webhook ${event?.id} failed: ${err.message}`),
      );
    return { received: true };
  }
}
