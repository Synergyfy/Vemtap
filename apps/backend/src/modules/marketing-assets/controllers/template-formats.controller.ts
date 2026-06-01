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
import { TemplateFormatsService } from '../services/template-formats.service';
import { CreateTemplateFormatDto } from '../dto/create-template-format.dto';
import { UpdateTemplateFormatDto } from '../dto/update-template-format.dto';
import { MarketingTemplateFormat } from '../entities/marketing-template-format.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Marketing Template Formats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing-template-formats')
export class TemplateFormatsController {
  constructor(private readonly formatsService: TemplateFormatsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new template format (Admin only)' })
  @ApiResponse({ status: 201, type: MarketingTemplateFormat })
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateTemplateFormatDto) {
    return this.formatsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all template formats' })
  @ApiResponse({ status: 200, type: [MarketingTemplateFormat] })
  findAll(@Query('all') all?: string) {
    const activeOnly = all !== 'true';
    return this.formatsService.findAll(activeOnly);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single template format' })
  @ApiResponse({ status: 200, type: MarketingTemplateFormat })
  findOne(@Param('id') id: string) {
    return this.formatsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template format (Admin only)' })
  @ApiResponse({ status: 200, type: MarketingTemplateFormat })
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateTemplateFormatDto) {
    return this.formatsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template format (Admin only)' })
  @ApiResponse({ status: 204 })
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.formatsService.remove(id);
  }
}
