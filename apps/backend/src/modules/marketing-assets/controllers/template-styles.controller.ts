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
import { TemplateStylesService } from '../services/template-styles.service';
import { CreateTemplateStyleDto } from '../dto/create-template-style.dto';
import { UpdateTemplateStyleDto } from '../dto/update-template-style.dto';
import { MarketingTemplateStyle } from '../entities/marketing-template-style.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Marketing Template Styles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing-template-styles')
export class TemplateStylesController {
  constructor(private readonly stylesService: TemplateStylesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new template style (Admin only)' })
  @ApiResponse({ status: 201, type: MarketingTemplateStyle })
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateTemplateStyleDto) {
    return this.stylesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all template styles' })
  @ApiResponse({ status: 200, type: [MarketingTemplateStyle] })
  findAll(@Query('all') all?: string) {
    const activeOnly = all !== 'true';
    return this.stylesService.findAll(activeOnly);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single template style' })
  @ApiResponse({ status: 200, type: MarketingTemplateStyle })
  findOne(@Param('id') id: string) {
    return this.stylesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template style (Admin only)' })
  @ApiResponse({ status: 200, type: MarketingTemplateStyle })
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateTemplateStyleDto) {
    return this.stylesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template style (Admin only)' })
  @ApiResponse({ status: 204 })
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.stylesService.remove(id);
  }
}
