import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ReorderBannersDto } from './dto/reorder-banners.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Banner } from './entities/banner.entity';

@ApiTags('banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'Get active banners (any authenticated user)' })
  @ApiResponse({
    status: 200,
    description: 'Active banners retrieved',
    type: [Banner],
  })
  async getActiveBanners(@Query('placement') placement?: 'business' | 'customer') {
    return this.bannersService.findActive(placement);
  }
}

@ApiTags('admin-banners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/banners')
export class AdminBannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all banners' })
  @ApiResponse({
    status: 200,
    description: 'All banners retrieved',
    type: [Banner],
  })
  async findAll(@Query('placement') placement?: 'business' | 'customer') {
    return this.bannersService.findAll(placement);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get a single banner' })
  @ApiResponse({ status: 200, description: 'Banner found', type: Banner })
  async findOne(@Param('id') id: string) {
    return this.bannersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Create a new banner' })
  @ApiResponse({ status: 201, description: 'Banner created', type: Banner })
  async create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Patch('reorder')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Reorder banners' })
  @ApiResponse({
    status: 200,
    description: 'Banners reordered',
    type: [Banner],
  })
  async reorder(@Body() dto: ReorderBannersDto) {
    return this.bannersService.reorder(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update a banner' })
  @ApiResponse({ status: 200, description: 'Banner updated', type: Banner })
  async update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Soft-delete a banner' })
  @ApiResponse({ status: 200, description: 'Banner deleted' })
  async remove(@Param('id') id: string) {
    await this.bannersService.remove(id);
    return { ok: true };
  }
}
