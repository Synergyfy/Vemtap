import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessProfilingService } from './business-profiling.service';
import { CreateBusinessProfileDto, UpdateBusinessProfileDto } from './dto/business-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole, User } from '../users/entities/user.entity';
import { BusinessProfile } from './entities/business-profile.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Business Profiling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('business-profiling')
export class BusinessProfilingController {
  constructor(private readonly profilingService: BusinessProfilingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business profile' })
  @ApiResponse({ status: 201, type: BusinessProfile })
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  create(@Request() req: RequestWithUser, @Body() createDto: CreateBusinessProfileDto) {
    return this.profilingService.create(req.user, createDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get profiling stats' })
  @ApiResponse({ status: 200 })
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  async getStats(@Request() req: RequestWithUser) {
    return this.profilingService.getStats(req.user);
  }

  @Public()
  @Post('public')
  @ApiOperation({ summary: 'Public business profiling submission' })
  @ApiResponse({ status: 201, type: BusinessProfile })
  createPublic(@Body() createDto: CreateBusinessProfileDto) {
    return this.profilingService.create(null, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all business profiles' })
  @ApiResponse({ status: 200, type: [BusinessProfile] })
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  findAll(
    @Request() req: RequestWithUser,
    @Query('search') search?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.profilingService.findAll(req.user, { search, priority, status, type });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a business profile by ID' })
  @ApiResponse({ status: 200, type: BusinessProfile })
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.profilingService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a business profile' })
  @ApiResponse({ status: 200, type: BusinessProfile })
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateDto: UpdateBusinessProfileDto) {
    return this.profilingService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a business profile' })
  @ApiResponse({ status: 204 })
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.profilingService.remove(id);
  }
}
