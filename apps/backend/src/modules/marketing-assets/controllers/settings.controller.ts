import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SettingsService } from '../services/settings.service';
import { SaveSettingDto } from '../dto/save-setting.dto';
import { MarketingSetting } from '../entities/marketing-setting.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Marketing Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing-settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all marketing system settings (Admin)' })
  @ApiResponse({ status: 200, type: [MarketingSetting] })
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a setting by key' })
  @ApiResponse({ status: 200, type: MarketingSetting })
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update a setting (Admin only)' })
  @ApiResponse({ status: 200, type: MarketingSetting })
  @Roles(UserRole.ADMIN)
  upsert(@Body() dto: SaveSettingDto) {
    return this.settingsService.upsert(dto);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a setting by key (Admin only)' })
  @ApiResponse({ status: 204 })
  @Roles(UserRole.ADMIN)
  remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }
}
