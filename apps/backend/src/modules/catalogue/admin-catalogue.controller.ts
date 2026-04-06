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
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogueService } from './catalogue.service';
import {
  CreateCatalogueCategoryDto,
  UpdateCatalogueCategoryDto,
} from './dto/category.dto';
import {
  CreateCatalogueItemDto,
  UpdateCatalogueItemDto,
  SuspendItemDto,
} from './dto/item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Admin Catalogue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/catalogue')
export class AdminCatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

  // Categories
  @Post('categories')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'Create a new catalogue category' })
  async createCategory(@Body() dto: CreateCatalogueCategoryDto, @Req() req: any) {
    return this.catalogueService.createCategory(dto, req.user.businessId);
  }

  @Get('categories')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'List all catalogue categories' })
  async listCategories(@Req() req: any) {
    return this.catalogueService.findAllCategories(req.user.businessId);
  }

  @Patch('categories/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'Update a catalogue category' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogueCategoryDto,
    @Req() req: any,
  ) {
    return this.catalogueService.updateCategory(id, dto, req.user.businessId);
  }

  @Delete('categories/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'Delete a catalogue category' })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.catalogueService.deleteCategory(id, req.user.businessId);
  }

  // Items
  @Post('items')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'Create a new catalogue item' })
  async createItem(@Body() dto: CreateCatalogueItemDto, @Req() req: any) {
    return this.catalogueService.createItem(dto, req.user.businessId);
  }

  @Get('items')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'List all items in the business catalogue' })
  async listItems(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.catalogueService.findAllItemsAdmin(req.user.businessId, branchId);
  }

  @Patch('items/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'Update a catalogue item (isolated or global)' })
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogueItemDto,
    @Req() req: any,
  ) {
    return this.catalogueService.updateItem(id, dto, req.user.businessId);
  }

  @Delete('items/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'Remove item from branch or delete globally' })
  async deleteItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('branchId') branchId: string,
    @Query('applyGlobally') applyGlobally: boolean,
    @Req() req: any,
  ) {
    return this.catalogueService.deleteItem(id, req.user.businessId, branchId, applyGlobally);
  }

  @Post('items/:id/import')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'Import an item to another branch' })
  async importItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('targetBranchId') targetBranchId: string,
    @Req() req: any,
  ) {
    return this.catalogueService.importItem(id, targetBranchId, req.user.businessId);
  }

  @Post('items/:id/suspend')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Suspend an item (System Admin only)' })
  async suspendItem(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SuspendItemDto) {
    return this.catalogueService.suspendItem(id, dto.reason);
  }

  @Post('items/:id/unsuspend')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Unsuspend an item (System Admin only)' })
  async unsuspendItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogueService.unsuspendItem(id);
  }
}
