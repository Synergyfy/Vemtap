import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKbCategoryDto, UpdateKbCategoryDto } from './dto/category.dto';
import { CreateKbSectionDto, UpdateKbSectionDto } from './dto/section.dto';
import { CreateKbPageDto, UpdateKbPageDto } from './dto/page.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Admin Knowledge Base')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('knowledge-base')
export class AdminKnowledgeBaseController {
  constructor(private readonly kbService: KnowledgeBaseService) {}

  // --- Categories ---
  @Post('categories')
  @ApiOperation({ summary: 'Create a knowledge base category' })
  async createCategory(@Body() dto: CreateKbCategoryDto) {
    return this.kbService.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a knowledge base category' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKbCategoryDto,
  ) {
    return this.kbService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({
    summary: 'Delete a knowledge base category (cascades sections and pages)',
  })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.kbService.deleteCategory(id);
  }

  // --- Sections ---
  @Post('sections')
  @ApiOperation({ summary: 'Create a knowledge base section' })
  async createSection(@Body() dto: CreateKbSectionDto) {
    return this.kbService.createSection(dto);
  }

  @Patch('sections/:id')
  @ApiOperation({ summary: 'Update a knowledge base section' })
  async updateSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKbSectionDto,
  ) {
    return this.kbService.updateSection(id, dto);
  }

  @Delete('sections/:id')
  @ApiOperation({ summary: 'Delete a knowledge base section (cascades pages)' })
  async deleteSection(@Param('id', ParseUUIDPipe) id: string) {
    return this.kbService.deleteSection(id);
  }

  // --- Pages ---
  @Post('pages')
  @ApiOperation({ summary: 'Create a knowledge base page' })
  async createPage(@Body() dto: CreateKbPageDto) {
    return this.kbService.createPage(dto);
  }

  @Patch('pages/:id')
  @ApiOperation({ summary: 'Update a knowledge base page' })
  async updatePage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKbPageDto,
  ) {
    return this.kbService.updatePage(id, dto);
  }

  @Delete('pages/:id')
  @ApiOperation({ summary: 'Delete a knowledge base page' })
  async deletePage(@Param('id', ParseUUIDPipe) id: string) {
    return this.kbService.deletePage(id);
  }
}
