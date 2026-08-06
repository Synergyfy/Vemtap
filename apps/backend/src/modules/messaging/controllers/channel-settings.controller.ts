import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/entities/user.entity';
import { ChannelSettingsService } from '../services/channel-settings.service';
import { UpdateChannelSettingsDto } from '../dto/update-channel-settings.dto';
import { MessagingHelperService } from '../services/messaging-helper.service';
import { BranchFilterDto } from '../../../common/dto/branch-filter.dto';

@ApiTags('Messaging Channel Settings')
@Controller('messaging/channel-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
export class ChannelSettingsController {
  constructor(
    private readonly channelSettingsService: ChannelSettingsService,
    private readonly messagingHelperService: MessagingHelperService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get SMS, WhatsApp, and Email channel settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getChannelSettings(
    @Request() req: { user: User },
    @Query() filter: BranchFilterDto,
  ) {
    const businessId = req.user.businessId;
    if (!businessId) {
      throw new BadRequestException('User does not have an active business');
    }
    const branchId = filter.branchId
      ? await this.messagingHelperService.resolveBranchId(
          req.user,
          filter.branchId,
        )
      : undefined;

    return this.channelSettingsService.getChannelSettings(businessId, branchId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update SMS, WhatsApp, and Email channel settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateChannelSettings(
    @Request() req: { user: User },
    @Body() dto: UpdateChannelSettingsDto,
  ) {
    const businessId = req.user.businessId;
    if (!businessId) {
      throw new BadRequestException('User does not have an active business');
    }
    if (dto.branchId) {
      dto.branchId = await this.messagingHelperService.resolveBranchId(
        req.user,
        dto.branchId,
      );
    }

    return this.channelSettingsService.updateChannelSettings(businessId, dto);
  }

  @Post('generate-dns-records')
  @ApiOperation({
    summary: 'Generate DNS records for email domain authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'DNS records generated successfully',
  })
  async generateDnsRecords(
    @Request() req: { user: User },
    @Body() dto: { domain?: string; branchId?: string },
  ) {
    const businessId = req.user.businessId;
    if (!businessId) {
      throw new BadRequestException('User does not have an active business');
    }
    return this.channelSettingsService.updateChannelSettings(businessId, {
      branchId: dto.branchId,
      emailCustomDomain: dto.domain,
      generateDnsRecords: true,
    });
  }
}
