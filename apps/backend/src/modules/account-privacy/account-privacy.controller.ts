import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { AccountPrivacyService } from './account-privacy.service';
import {
  AccountPrivacyDto,
  CreateDataRequestDto,
  DataExportFileDto,
  UpdateAccountPrivacyDto,
} from './dto/account-privacy.dto';

interface AuthedRequest {
  user: User;
}

@ApiTags('Account Privacy (NDPR)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
@Controller('account/privacy')
export class AccountPrivacyController {
  constructor(private readonly privacy: AccountPrivacyService) {}

  @Get()
  @ApiOperation({
    summary: 'My privacy and processing choices',
    description:
      'Business-wide: restrictProcessing, analytics. Personal: marketing (VemTap marketing notifications), deviceAlerts. Access: OWNER, MANAGER, STAFF.',
  })
  @ApiResponse({ status: 200, type: AccountPrivacyDto })
  get(@Req() req: AuthedRequest) {
    return this.privacy.get(req.user);
  }

  @Patch()
  @ApiOperation({
    summary: 'Change privacy and processing choices',
    description:
      'Personal fields for anyone; business-wide fields only for the owner or a manager (ignored otherwise — see canManageBusiness). Restricting processing blocks AI features that send the business’s data to an AI provider. Access: OWNER, MANAGER, STAFF.',
  })
  @ApiResponse({ status: 200, type: AccountPrivacyDto })
  update(@Req() req: AuthedRequest, @Body() dto: UpdateAccountPrivacyDto) {
    return this.privacy.update(req.user, dto);
  }

  @Post('export')
  @Roles(UserRole.OWNER)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({
    summary: 'Export my business’s data (NDPR access/portability)',
    description:
      'A JSON archive (account, business, team, branches, catalogue, deals, contacts, orders, POS sales, campaigns; up to 5000 rows each, tokens stripped), base64-encoded, logged as a completed data request. 3 per hour. Access: OWNER.',
  })
  @ApiResponse({ status: 201, type: DataExportFileDto })
  export(@Req() req: AuthedRequest) {
    return this.privacy.export(req.user);
  }

  @Get('requests')
  @ApiOperation({ summary: 'My data requests (exports and rectifications)' })
  listRequests(@Req() req: AuthedRequest) {
    return this.privacy.listRequests(req.user);
  }

  @Post('requests')
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @ApiOperation({
    summary: 'Ask for personal data to be corrected (NDPR rectification)',
    description:
      'Logged with a reference and a 72-hour response deadline; emailed to the DPO when DPO_EMAIL is configured. Access: OWNER, MANAGER, STAFF.',
  })
  requestRectification(
    @Req() req: AuthedRequest,
    @Body() dto: CreateDataRequestDto,
  ) {
    return this.privacy.requestRectification(req.user, dto);
  }
}
