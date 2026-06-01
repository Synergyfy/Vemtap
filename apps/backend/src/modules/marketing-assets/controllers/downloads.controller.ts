import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { DownloadsService } from '../services/downloads.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { User } from '../../users/entities/user.entity';
import { MarketingDownload } from '../entities/marketing-download.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Marketing Downloads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing-downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Post(':assetId')
  @ApiOperation({ summary: 'Record a PDF/PNG print download event' })
  @ApiResponse({ status: 201, type: MarketingDownload })
  record(
    @Req() req: RequestWithUser,
    @Param('assetId') assetId: string,
    @Body('format') format: string,
  ) {
    return this.downloadsService.recordDownload(assetId, format, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get print downloads log history for business' })
  @ApiResponse({ status: 200, type: [MarketingDownload] })
  findAll(
    @Req() req: RequestWithUser,
    @Query('assetId') assetId?: string,
  ) {
    return this.downloadsService.getDownloads(req.user, assetId);
  }
}
