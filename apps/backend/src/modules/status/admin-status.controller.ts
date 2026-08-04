import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatusService } from './status.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateIncidentDto,
  CreateSystemComponentDto,
  UpdateIncidentDto,
  UpdateSystemComponentDto,
} from './dto/status.dto';

@ApiTags('Status Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/status')
@Roles(UserRole.ADMIN)
export class AdminStatusController {
  constructor(private readonly statusService: StatusService) {}

  @Post('components')
  @ApiOperation({ summary: 'Create or upsert a status component' })
  @ApiBody({ type: CreateSystemComponentDto })
  createComponent(@Body() dto: CreateSystemComponentDto) {
    return this.statusService.createComponent(dto);
  }

  @Get('components')
  @ApiOperation({ summary: 'List all status components' })
  findAllComponents() {
    return this.statusService.findAllComponents();
  }

  @Patch('components/:id')
  @ApiOperation({ summary: 'Update a status component' })
  @ApiBody({ type: UpdateSystemComponentDto })
  updateComponent(
    @Param('id') id: string,
    @Body() dto: UpdateSystemComponentDto,
  ) {
    return this.statusService.updateComponent(id, dto);
  }

  @Delete('components/:id')
  @ApiOperation({ summary: 'Delete a status component' })
  removeComponent(@Param('id') id: string) {
    return this.statusService.removeComponent(id);
  }

  @Post('incidents')
  @ApiOperation({ summary: 'Create an incident' })
  @ApiBody({ type: CreateIncidentDto })
  createIncident(@Body() dto: CreateIncidentDto) {
    return this.statusService.createIncident(dto);
  }

  @Get('incidents')
  @ApiOperation({ summary: 'List all incidents' })
  findAllIncidents() {
    return this.statusService.findAllIncidents();
  }

  @Patch('incidents/:id')
  @ApiOperation({ summary: 'Update an incident' })
  @ApiBody({ type: UpdateIncidentDto })
  updateIncident(@Param('id') id: string, @Body() dto: UpdateIncidentDto) {
    return this.statusService.updateIncident(id, dto);
  }

  @Delete('incidents/:id')
  @ApiOperation({ summary: 'Delete an incident' })
  removeIncident(@Param('id') id: string) {
    return this.statusService.removeIncident(id);
  }
}
