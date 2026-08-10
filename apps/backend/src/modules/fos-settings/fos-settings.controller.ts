import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosSettingsService } from './fos-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  UpdateFosSettingsDto,
  InviteTeamMemberDto,
} from './dto/fos-settings.dto';

@ApiTags('FOS Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('settings')
export class FosSettingsController {
  constructor(private readonly settingsService: FosSettingsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get FOS platform settings (masked secrets)' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update FOS platform settings' })
  async updateSettings(@Body() dto: UpdateFosSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }

  @Get('team')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List platform team members' })
  async getTeam() {
    return this.settingsService.getTeam();
  }

  @Post('team/invite')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Invite a platform team member' })
  async inviteMember(@Body() dto: InviteTeamMemberDto) {
    return this.settingsService.inviteMember(dto);
  }

  @Delete('team/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove a platform team member' })
  async removeMember(@Param('id') id: string) {
    return this.settingsService.removeMember(id);
  }
}
