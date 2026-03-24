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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { FormTemplateQueryDto } from './dto/form-template-query.dto';
import { FormTemplateStatsDto } from './dto/form-template-stats.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, User } from '../users/entities/user.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Form Templates')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('form-templates')
export class FormTemplatesController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new form template (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'The template has been successfully created.',
    schema: {
      example: {
        id: 'uuid-template-1',
        name: 'Feedback Template',
        description: 'Template for feedback',
        fields: [
          {
            id: 'uuid-field-1',
            type: 'text',
            question: 'Your Name',
            isRequired: true,
            order: 0,
          },
        ],
      },
    },
  })
  create(@Body() createFormTemplateDto: CreateFormTemplateDto) {
    return this.formsService.createTemplate(createFormTemplateDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({
    summary: 'Get all form templates (Admin and Business Owners)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return list of templates with pagination.',
    schema: {
      example: {
        items: [
          {
            id: 'uuid-template-1',
            name: 'Feedback Template',
            description: 'Template for feedback',
            createdAt: '2023-01-01T00:00:00Z',
          },
        ],
        total: 1,
      },
    },
  })
  findAll(@Query() query: FormTemplateQueryDto) {
    return this.formsService.findAllTemplates(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get tracking statistics for all form templates (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return tracking statistics for all templates.',
    type: [FormTemplateStatsDto],
    schema: {
      example: [
        {
          templateId: 'uuid-template-1',
          templateName: 'Feedback Template',
          usageCount: 5,
          totalResponses: 120,
          uniqueBranchesCount: 3,
          uniqueBusinessesCount: 2,
        },
      ],
    },
  })
  getAllStats() {
    return this.formsService.getAllTemplatesStats();
  }

  @Get(':id/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Get tracking statistics for a specific form template (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({
    status: 200,
    description: 'Return tracking statistics for the template.',
    type: FormTemplateStatsDto,
    schema: {
      example: {
        templateId: 'uuid-template-1',
        templateName: 'Feedback Template',
        usageCount: 5,
        totalResponses: 120,
        uniqueBranchesCount: 3,
        uniqueBusinessesCount: 2,
        usage: [
          {
            formId: 'uuid-form-1',
            branchName: 'Main Branch',
            businessName: 'The Azure Bistro',
            responseCount: 45,
          },
        ],
      },
    },
  })
  getStats(@Param('id') id: string) {
    return this.formsService.getTemplateStats(id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get a form template by id' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({
    status: 200,
    description: 'The template details.',
  })
  findOne(@Param('id') id: string) {
    return this.formsService.findTemplateById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a form template (Admin only)' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({
    status: 200,
    description: 'The template has been successfully updated.',
  })
  update(
    @Param('id') id: string,
    @Body() updateFormTemplateDto: UpdateFormTemplateDto,
  ) {
    return this.formsService.updateTemplate(id, updateFormTemplateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a form template (Admin only)' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({
    status: 200,
    description: 'The template has been successfully deleted.',
  })
  remove(@Param('id') id: string) {
    return this.formsService.deleteTemplate(id);
  }

  @Post(':id/use')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'Use a template to create a form for a branch (Business Owner)',
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({
    status: 201,
    description: 'A new form has been created from the template.',
    schema: {
      example: {
        id: 'uuid-form-1',
        title: 'Feedback Template',
        description: 'Template for feedback',
        branchId: 'uuid-branch-1',
        businessId: 'uuid-business-1',
        templateId: 'uuid-template-1',
        creatorId: 'uuid-user-1',
        isActive: true,
        isPublished: false,
      },
    },
  })
  useTemplate(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Query('branchId') branchId: string,
  ) {
    return this.formsService.useTemplate(branchId, id, req.user.id);
  }
}
