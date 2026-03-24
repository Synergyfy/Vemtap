import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateSubcategoryDto,
  UpdateSubcategoryDto,
  CategoryPaginationDto,
  SubcategoryPaginationDto,
} from './dto/category.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Categories (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  remove(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }

  @Post('subcategories')
  @ApiOperation({ summary: 'Create a new subcategory' })
  createSub(@Body() dto: CreateSubcategoryDto) {
    return this.categoriesService.createSubcategory(dto);
  }

  @Patch('subcategories/:id')
  @ApiOperation({ summary: 'Update a subcategory' })
  updateSub(@Param('id') id: string, @Body() dto: UpdateSubcategoryDto) {
    return this.categoriesService.updateSubcategory(id, dto);
  }

  @Delete('subcategories/:id')
  @ApiOperation({ summary: 'Delete a subcategory' })
  removeSub(@Param('id') id: string) {
    return this.categoriesService.deleteSubcategory(id);
  }
}

@ApiTags('Categories (Public)')
@Controller('categories')
export class PublicCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all categories with pagination and search' })
  findAll(@Query() dto: CategoryPaginationDto) {
    return this.categoriesService.findAllCategories(dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findCategoryById(id);
  }

  @Public()
  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Get all subcategories for a specific category' })
  findSubcategories(
    @Param('id') categoryId: string,
    @Query() dto: SubcategoryPaginationDto,
  ) {
    dto.categoryId = categoryId;
    return this.categoriesService.findAllSubcategories(dto);
  }

  @Public()
  @Get('subcategories/search')
  @ApiOperation({ summary: 'Search subcategories globally' })
  searchSubcategories(@Query() dto: SubcategoryPaginationDto) {
    return this.categoriesService.findAllSubcategories(dto);
  }
}
