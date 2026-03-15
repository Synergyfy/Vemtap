import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, CampaignStatus } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCampaignTemplateDto } from './dto/campaign-template.dto';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BranchQueryDto } from './dto/loyalty.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipSubscriptionCheck } from '../subscriptions/decorators/skip-subscription-check.decorator';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  private async getBranchId(
    req: { user: User },
    branchId?: string,
  ): Promise<string> {
    const user = req.user;

    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (!branchId) {
        throw new BadRequestException('branchId is required for Owners and Admins');
      }
      if (user.role === UserRole.OWNER) {
        const hasAccess = await this.campaignsService.checkBranchAccess(user, branchId);
        if (!hasAccess) throw new BadRequestException('Access denied to this branch');
      }
      return branchId;
    }

    if (!user.branchId) throw new BadRequestException('User is not associated with any branch');
    return user.branchId;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, type: Campaign })
  async create(
    @Body() createCampaignDto: CreateCampaignDto,
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const branchId = await this.getBranchId(req, query.branchId || createCampaignDto.branchId);
    return this.campaignsService.create(createCampaignDto, branchId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all campaigns' })
  async findAll(@Req() req: { user: User }, @Query('status') status?: CampaignStatus, @Query() query?: BranchQueryDto) {
    const user = req.user;
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (query?.allBranches || !query?.branchId) {
        return this.campaignsService.findAll(undefined, status, user.businessId || query?.businessId);
      }
    }
    const branchId = await this.getBranchId(req, query?.branchId);
    return this.campaignsService.findAll(branchId, status);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get campaign dashboard statistics' })
  async getStats(@Req() req: { user: User }, @Query() query: BranchQueryDto) {
    const user = req.user;
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (query.allBranches || !query.branchId) {
        return this.campaignsService.getStats(undefined, user.businessId || query?.businessId);
      }
    }
    const branchId = await this.getBranchId(req, query.branchId);
    return this.campaignsService.getStats(branchId);
  }

  @Get('templates')
  @SkipSubscriptionCheck()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get campaign templates' })
  async getTemplates(@Req() req: { user: User }, @Query() query: BranchQueryDto) {
    const user = req.user;
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (query.allBranches || !query.branchId) {
        return this.campaignsService.getTemplates(undefined, user.businessId || query?.businessId);
      }
    }
    const branchId = await this.getBranchId(req, query.branchId);
    return this.campaignsService.getTemplates(branchId);
  }

  @Post('templates')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a campaign template' })
  async createTemplate(@Body() createTemplateDto: CreateCampaignTemplateDto, @Req() req: { user: User }, @Query() query: BranchQueryDto) {
    const branchId = await this.getBranchId(req, query.branchId ?? createTemplateDto.branchId ?? undefined);
    return this.campaignsService.createTemplate(createTemplateDto, branchId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a campaign by ID' })
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a campaign' })
  update(@Param('id') id: string, @Body() updateCampaignDto: UpdateCampaignDto) {
    return this.campaignsService.update(id, updateCampaignDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a campaign' })
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }
}
