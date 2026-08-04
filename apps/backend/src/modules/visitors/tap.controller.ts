import { Controller, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { VisitorsService } from './visitors.service';

@ApiTags('Tap')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tap')
export class TapController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Post('record/:code')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Record an authenticated customer device visit' })
  @ApiResponse({
    status: 201,
    description: 'Visit recorded or existing cooldown visit returned',
  })
  async record(@Param('code') code: string, @Req() req: any) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = (typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]
      : undefined)?.trim() ?? req.socket?.remoteAddress ?? req.ip;

    return this.visitorsService.recordPortalVisit({
      customerId: req.user.id,
      deviceCode: code,
      sessionToken: req.headers['x-visit-session-token'],
      ipAddress,
      userAgent: req.headers['user-agent'],
    });
  }
}
