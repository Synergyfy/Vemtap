import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosProfileService } from './fos-profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { UpdateProfileDto, ProfileActivityQueryDto } from './dto/profile.dto';

@ApiTags('FOS Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('profile')
export class FosProfileController {
  constructor(private readonly profileService: FosProfileService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get the current user profile' })
  getProfile(@Request() req: { user?: User }) {
    return this.profileService.getProfile(req.user as User);
  }

  @Patch()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update the current user profile' })
  async updateProfile(
    @Request() req: { user?: User },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(req.user as User, dto);
  }

  @Get('activity')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get server-generated profile activity' })
  async getActivity(
    @Request() req: { user?: User },
    @Query() query: ProfileActivityQueryDto,
  ) {
    return this.profileService.getActivity(req.user as User, query.limit || 20);
  }
}
