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
import { CategoriesService } from '../services/categories.service';
import { CreateMarketingCategoryDto } from '../dto/create-category.dto';
import { UpdateMarketingCategoryDto } from '../dto/update-category.dto';
import { MarketingCategory } from '../entities/marketing-category.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Marketing Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing-categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({ status: 201, type: MarketingCategory })
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateMarketingCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, type: [MarketingCategory] })
  findAll(@Query('all') all?: string) {
    const activeOnly = all !== 'true';
    return this.categoriesService.findAll(activeOnly);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category' })
  @ApiResponse({ status: 200, type: MarketingCategory })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category (Admin only)' })
  @ApiResponse({ status: 200, type: MarketingCategory })
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateMarketingCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category (Admin only)' })
  @ApiResponse({ status: 204 })
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
