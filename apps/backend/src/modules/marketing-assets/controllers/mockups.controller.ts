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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MockupsService } from '../services/mockups.service';
import { CreateMockupDto } from '../dto/create-mockup.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { MarketingMockup } from '../entities/marketing-mockup.entity';

@ApiTags('Marketing Mockups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing-mockups')
export class MockupsController {
  constructor(private readonly mockupsService: MockupsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new mockup preset (Admin only)' })
  @ApiResponse({ status: 201, type: MarketingMockup })
  @Roles(UserRole.ADMIN)
  create(@Body() createDto: CreateMockupDto) {
    return this.mockupsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all mockup backdrop presets' })
  @ApiResponse({ status: 200, type: [MarketingMockup] })
  findAll(@Query('type') type?: string, @Query('all') all?: string) {
    const activeOnly = all !== 'true';
    return this.mockupsService.findAll(type, activeOnly);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single mockup' })
  @ApiResponse({ status: 200, type: MarketingMockup })
  findOne(@Param('id') id: string) {
    return this.mockupsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update mockup details (Admin only)' })
  @ApiResponse({ status: 200, type: MarketingMockup })
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateDto: Partial<CreateMockupDto>) {
    return this.mockupsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a mockup (Admin only)' })
  @ApiResponse({ status: 204 })
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.mockupsService.remove(id);
  }
}
