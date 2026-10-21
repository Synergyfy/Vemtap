import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { FindCampaignsDto } from './dto/find-campaigns.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { SendCampaignDto } from './dto/send-campaign.dto';
import { Campaign } from './entities/campaign.entity';
import { TrialRestrictionGuard } from '../subscriptions/guards/trial-restriction.guard';
import { CreateCampaignTemplateDto } from './dto/campaign-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { BannersService } from '../banners/banners.service';
import { Banner } from '../banners/entities/banner.entity';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly bannersService: BannersService,
  ) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('engagement')
  @ApiOperation({ summary: 'Create a new campaign' })
  async create(
    @Request() req: { user: User },
    @Body() createCampaignDto: CreateCampaignDto,
    @Query('branchId') branchId: string,
  ) {
    return this.campaignsService.create(createCampaignDto, branchId, req.user);
  }
  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @Permissions('engagement')
  @ApiOperation({ summary: 'Get all campaigns for a branch or business' })
  async findAll(
    @Request() req: { user: User },
    @Query() query: FindCampaignsDto,
  ) {
    return this.campaignsService.findAll(
      req.user,
      query.branchId,
      query.status,
    );
  }

  @Get('featured')
  @ApiOperation({
    summary: 'Featured campaign banners for the customer app',
    description:
      'Active banners for the `customer` placement, ordered by sort order. ' +
      'Backed by the banners module; no role restriction (any authenticated ' +
      'user). Declared before `:id` so the static path is not shadowed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active customer banners',
    type: [Banner],
  })
  async getFeaturedCampaigns(): Promise<Banner[]> {
    return this.bannersService.findActive('customer');
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all campaign templates' })
  async findAllTemplates() {
    return this.campaignsService.findAllTemplates();
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('engagement')
  @ApiOperation({
    summary: 'Get a campaign by ID',
    description:
      "Only the caller's own business's campaigns; any other id is a 404. Access: OWNER, MANAGER",
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async findOne(
    @Request() req: { user: User },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignsService.findOne(id, req.user.businessId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('engagement')
  @ApiOperation({
    summary: 'Update a campaign',
    description:
      "Only the caller's own business's campaigns; any other id is a 404. Access: OWNER, MANAGER",
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async update(
    @Request() req: { user: User },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(
      id,
      updateCampaignDto,
      req.user.businessId,
    );
  }

  @Post(':id/send')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('engagement')
  @UseGuards(TrialRestrictionGuard)
  @ApiOperation({
    summary: 'Send a campaign to customers',
    description:
      "Queues the campaign's message for the given customers through the messaging engine, " +
      "using the business's channel credits. Ids that are not the business's customers, or " +
      'that opted out of the channel, are skipped. A campaign whose `scheduledFor` is in the ' +
      'future stays `Scheduled` and is sent automatically when due. Access: OWNER, MANAGER',
  })
  @ApiBody({ type: SendCampaignDto })
  @ApiResponse({
    status: 201,
    description: 'Sent or scheduled',
    type: Campaign,
  })
  @ApiResponse({
    status: 400,
    description: 'No reachable customers, or not enough credits',
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 409, description: 'Campaign has already been sent' })
  async send(
    @Request() req: { user: User },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendCampaignDto,
  ) {
    return this.campaignsService.send(id, req.user.businessId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('engagement')
  @ApiOperation({
    summary: 'Delete a campaign',
    description:
      "Only the caller's own business's campaigns; any other id is a 404. Access: OWNER, MANAGER",
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async remove(
    @Request() req: { user: User },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignsService.remove(id, req.user.businessId);
  }

  @Post('templates')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a campaign template' })
  async createTemplate(@Body() createTemplateDto: CreateCampaignTemplateDto) {
    return this.campaignsService.createTemplate(createTemplateDto);
  }
}
