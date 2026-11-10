import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Setting } from './entities/setting.entity';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('admin-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get global system settings' })
  @ApiResponse({
    status: 200,
    description: 'System settings retrieved',
    type: Setting,
  })
  async getSettings() {
    return this.settingsService.toPublicView(
      await this.settingsService.getGlobalSettings(),
    );
  }

  @Patch()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update global system settings' })
  @ApiBody({ type: UpdateSettingDto })
  @ApiResponse({
    status: 200,
    description: 'System settings updated successfully',
    type: Setting,
  })
  async updateSettings(@Body() updateDto: UpdateSettingDto) {
    return this.settingsService.toPublicView(
      await this.settingsService.updateSettings(updateDto),
    );
  }
}

/** Settings any visitor may read. */
@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('referral-video')
  @ApiOperation({
    summary: 'The referral programme video link (null = use the app default)',
  })
  async getReferralVideo(): Promise<{
    url: string | null;
    updatedAt: string | null;
  }> {
    const settings = await this.settingsService.getGlobalSettings();
    return {
      url: settings?.referralVideoUrl ?? null,
      updatedAt: settings?.referralVideoUrl
        ? (settings.updatedAt?.toISOString() ?? null)
        : null,
    };
  }
}
