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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TemplatesService } from '../services/templates.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { MarketingTemplate } from '../entities/marketing-template.entity';
import type { Request } from 'express';

@ApiTags('Marketing Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing-templates')
export class MarketingTemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new print template (Admin only)' })
  @ApiResponse({ status: 201, type: MarketingTemplate })
  @Roles(UserRole.ADMIN)
  create(@Body() createDto: CreateTemplateDto, @Req() req: Request) {
    return this.templatesService.create(createDto, (req as any).user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all active print templates' })
  @ApiResponse({ status: 200, type: [MarketingTemplate] })
  findAll(
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('all') all?: string,
    @Query('categoryIds') categoryIds?: string,
  ) {
    const activeOnly = all !== 'true';
    const ids = categoryIds
      ? categoryIds.split(',').filter(Boolean)
      : undefined;
    return this.templatesService.findAll(category, type, activeOnly, ids);
  }

  @Get('categories')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get list of unique template categories' })
  @ApiResponse({ status: 200, type: [String] })
  getCategories() {
    return this.templatesService.getCategories();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get a template by ID' })
  @ApiResponse({ status: 200, type: MarketingTemplate })
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template (Admin only)' })
  @ApiResponse({ status: 200, type: MarketingTemplate })
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTemplateDto,
    @Req() req: Request,
  ) {
    return this.templatesService.update(id, updateDto, (req as any).user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template (Admin only)' })
  @ApiResponse({ status: 204 })
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.templatesService.remove(id, (req as any).user);
  }
}
