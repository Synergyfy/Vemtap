import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CustomerInvitesService } from './customer-invites.service';
import {
  CreateCustomerInviteDto,
  CustomerInviteResponseDto,
  InviteEmailRegistrationDto,
  InviteRegistrationDto,
  InviteRegistrationResponseDto,
  PublicCustomerInviteDto,
} from './dto/customer-invites.dto';

interface BusinessRequest {
  user: { id: string; businessId: string };
}

@ApiTags('Business Customers (CRM)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
@Permissions('visitors', 'customer-experience')
@Controller('business-customers/invites')
export class CustomerInvitesController {
  constructor(private readonly invites: CustomerInvitesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a customer invite link',
    description:
      'Issues a 30-day link `/join/{businessUniqueCode}?invite=TOKEN` for the caller’s business. Access: OWNER, MANAGER, STAFF with the visitors or customer-experience permission.',
  })
  @ApiResponse({ status: 201, type: CustomerInviteResponseDto })
  create(@Req() req: BusinessRequest, @Body() dto: CreateCustomerInviteDto) {
    return this.invites.create(req.user.businessId, req.user.id, dto);
  }
}

@ApiTags('Public Customer Invites')
@Public()
@Controller('public/customer-invites')
export class PublicCustomerInvitesController {
  constructor(private readonly invites: CustomerInvitesService) {}

  @Get(':token')
  @ApiOperation({
    summary: 'Look up a customer invite',
    description:
      'The business behind an invite link. `valid: false` once it has expired or been revoked. Access: Public.',
  })
  @ApiResponse({ status: 200, type: PublicCustomerInviteDto })
  @ApiResponse({ status: 404, description: 'Unknown token' })
  describe(@Param('token') token: string) {
    return this.invites.describe(token);
  }

  @Post(':token/registrations')
  @ApiOperation({
    summary: 'Join a business’s customer list',
    description:
      'Saves name and phone (and optional email) as a contact of the business, tagged `invite`. With an email the "you’ve joined" email is queued and the status is `pending_email`. Access: Public.',
  })
  @ApiResponse({ status: 201, type: InviteRegistrationResponseDto })
  @ApiResponse({ status: 404, description: 'Unknown token' })
  @ApiResponse({ status: 410, description: 'Expired or revoked invite' })
  register(@Param('token') token: string, @Body() dto: InviteRegistrationDto) {
    return this.invites.register(token, dto);
  }

  @Post(':token/email-registration')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Join a business’s customer list with an email only',
    description:
      'Saves the email as a contact of the business and queues the "you’ve joined" email. Access: Public.',
  })
  @ApiResponse({ status: 202, type: InviteRegistrationResponseDto })
  @ApiResponse({ status: 404, description: 'Unknown token' })
  @ApiResponse({ status: 410, description: 'Expired or revoked invite' })
  registerEmail(
    @Param('token') token: string,
    @Body() dto: InviteEmailRegistrationDto,
  ) {
    return this.invites.registerEmail(token, dto.email);
  }
}
