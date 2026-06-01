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
import { User } from '../../users/entities/user.entity';
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
  @ApiOperation({ summary: 'Save a customized marketing asset' })
  @ApiResponse({ status: 201, type: MarketingAsset })
  create(@Req() req: RequestWithUser, @Body() createDto: CreateAssetDto) {
    return this.assetsService.create(req.user, createDto);
  }

  @Get()
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
  @ApiOperation({ summary: 'Get a specific marketing asset' })
  @ApiResponse({ status: 200, type: MarketingAsset })
  findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.assetsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update custom layout config for a marketing asset' })
  @ApiResponse({ status: 200, type: MarketingAsset })
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateAssetDto,
  ) {
    return this.assetsService.update(id, req.user, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (deactivate) a marketing asset' })
  @ApiResponse({ status: 204 })
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.assetsService.remove(id, req.user);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get version history for a marketing asset' })
  @ApiResponse({ status: 200 })
  getVersions(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.assetsService.getVersions(id, req.user);
  }

  @Post(':id/restore/:versionId')
  @ApiOperation({ summary: 'Restore a marketing asset to a prior version state' })
  @ApiResponse({ status: 200, type: MarketingAsset })
  restoreVersion(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.assetsService.restoreVersion(id, versionId, req.user);
  }
}
