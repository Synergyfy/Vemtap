import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AssetsService } from '../services/assets.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/entities/user.entity';
import { MarketingAsset } from '../entities/marketing-asset.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Marketing Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing-assets')
export class MarketingAssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({ summary: 'Save a customized marketing asset' })
  @ApiResponse({ status: 201, type: MarketingAsset })
  create(@Req() req: RequestWithUser, @Body() createDto: CreateAssetDto) {
    return this.assetsService.create(req.user, createDto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all marketing assets for the active business' })
  @ApiResponse({ status: 200, type: [MarketingAsset] })
  findAll(
    @Req() req: RequestWithUser,
    @Query('branchId') branchId?: string,
    @Query('type') type?: string,
  ) {
    return this.assetsService.findAll(req.user, branchId, type);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a specific marketing asset' })
  @ApiResponse({ status: 200, type: MarketingAsset })
  findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.assetsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update custom layout config for a marketing asset',
  })
  @ApiResponse({ status: 200, type: MarketingAsset })
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateAssetDto,
  ) {
    return this.assetsService.update(id, req.user, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete (deactivate) a marketing asset' })
  @ApiResponse({ status: 204 })
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.assetsService.remove(id, req.user);
  }

  @Get(':id/versions')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get version history for a marketing asset' })
  @ApiResponse({ status: 200 })
  getVersions(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.assetsService.getVersions(id, req.user);
  }

  @Post(':id/restore/:versionId')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Restore a marketing asset to a prior version state',
  })
  @ApiResponse({ status: 200, type: MarketingAsset })
  restoreVersion(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.assetsService.restoreVersion(id, versionId, req.user);
  }
}
