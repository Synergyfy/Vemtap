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
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, CampaignStatus } from './dto/create-campaign.dto';
import { FindCampaignsDto } from './dto/find-campaigns.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCampaignTemplateDto } from './dto/campaign-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('engagement')
  @ApiOperation({ summary: 'Create a new campaign' })
  async create(
    @Request() req: { user: User },
    @Body() createCampaignDto: CreateCampaignDto,
    @Query('branchId') branchId: string,
  ) {
    return this.campaignsService.create(createCampaignDto, branchId);
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
      query.branchId,
      query.status,
      req.user.businessId,
    );
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('engagement')
  @ApiOperation({ summary: 'Get a campaign by ID' })
  async findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('engagement')
  @ApiOperation({ summary: 'Update a campaign' })
  async update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(id, updateCampaignDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('engagement')
  @ApiOperation({ summary: 'Delete a campaign' })
  async remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }

  @Post('templates')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a campaign template' })
  async createTemplate(@Body() createTemplateDto: CreateCampaignTemplateDto) {
    return this.campaignsService.createTemplate(createTemplateDto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all campaign templates' })
  async findAllTemplates() {
    return this.campaignsService.findAllTemplates();
  }
}
