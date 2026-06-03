import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BrandProfileService } from '../services/brand-profile.service';
import { SaveBrandOverrideDto } from '../dto/brand-override.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { User } from '../../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Marketing Brand Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing-brand-profile')
export class BrandProfileController {
  constructor(private readonly brandProfileService: BrandProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current business marketing brand profile (combined default + overrides)' })
  getProfile(@Req() req: RequestWithUser) {
    return this.brandProfileService.getBrandProfile(req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Save brand style configurations overrides' })
  saveOverride(
    @Req() req: RequestWithUser,
    @Body() dto: SaveBrandOverrideDto,
  ) {
    return this.brandProfileService.saveBrandOverride(req.user, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Reset overrides and fallback back to global business default profile styling' })
  deleteOverride(@Req() req: RequestWithUser) {
    return this.brandProfileService.deleteBrandOverride(req.user);
  }
}
