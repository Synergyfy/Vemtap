import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  async getHealth() {
    return this.systemService.getSystemHealth();
  }
}
