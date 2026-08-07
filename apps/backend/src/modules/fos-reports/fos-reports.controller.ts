import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosReportsService } from './fos-reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CustomReportDto } from './dto/custom-report.dto';

@ApiTags('FOS Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('reports')
export class FosReportsController {
  constructor(private readonly reportsService: FosReportsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get FOS report sections and investor metrics' })
  async getReports() {
    return this.reportsService.getReports();
  }

  @Get('management')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get the executive management summary' })
  async getManagementSummary() {
    return this.reportsService.getManagementSummary();
  }

  @Post('custom')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Generate a custom report' })
  async getCustomReport(@Body() dto: CustomReportDto) {
    return this.reportsService.getCustomReport(dto);
  }
}
