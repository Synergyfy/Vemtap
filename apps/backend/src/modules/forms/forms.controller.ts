import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BranchFilterDto } from '../../common/dto/branch-filter.dto';
import { Query } from '@nestjs/common';

@ApiTags('Business Forms')
@ApiBearerAuth()
@Controller('business-forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new form for the current business' })
  @ApiBody({
    type: CreateFormDto,
    examples: {
      default: {
        summary: 'Sample form payload',
        value: {
          title: 'Customer Feedback',
          description: 'Let us know how your visit went',
          isActive: true,
          isPublished: true,
          branchId: 'uuid-branch-1234',
          fields: [
            {
              type: 'text',
              question: 'What was the reason for your visit?',
              isRequired: true,
              order: 1,
            },
            {
              type: 'radio',
              question: 'How would you rate our service?',
              options: ['1', '2', '3', '4', '5'],
              isRequired: true,
              order: 2,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The form has been successfully created.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-form-1234' },
        title: { type: 'string', example: 'Customer Feedback' },
        description: {
          type: 'string',
          example: 'Let us know how your visit went',
        },
        isActive: { type: 'boolean', example: true },
        isPublished: { type: 'boolean', example: true },
        businessId: { type: 'string', example: 'uuid-business-1234' },
        branchId: { type: 'string', example: 'uuid-branch-1234' },
        fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-field-1234' },
              type: { type: 'string', example: 'radio' },
              question: {
                type: 'string',
                example: 'How would you rate our service?',
              },
              options: {
                type: 'array',
                items: { type: 'string' },
                example: ['1', '2', '3', '4', '5'],
              },
              isRequired: { type: 'boolean', example: true },
              order: { type: 'number', example: 2 },
            },
          },
        },
      },
    },
  })
  create(@Request() req, @Body() createFormDto: CreateFormDto) {
    if (!createFormDto.branchId && req.user.branchId) {
      createFormDto.branchId = req.user.branchId;
    }
    return this.formsService.createForm(req.user.businessId, createFormDto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all forms for the current business' })
  @ApiResponse({
    status: 200,
    description: 'Return all forms array.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-form-1234' },
          title: { type: 'string', example: 'Customer Feedback' },
          description: {
            type: 'string',
            example: 'Let us know how your visit went',
          },
          isActive: { type: 'boolean', example: true },
          isPublished: { type: 'boolean', example: true },
        },
      },
    },
  })
  findAll(@Request() req, @Query() filter: BranchFilterDto) {
    return this.formsService.getFormsByBusiness(
      req.user.businessId,
      filter.branchId,
    );
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a specific form by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the form with its fields.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-form-1234' },
        title: { type: 'string', example: 'Customer Feedback' },
        fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-field-1234' },
              type: { type: 'string', example: 'text' },
              question: {
                type: 'string',
                example: 'What was the reason for your visit?',
              },
            },
          },
        },
      },
    },
  })
  findOne(@Request() req, @Param('id') id: string) {
    return this.formsService.getFormById(req.user.businessId, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a specific form by ID' })
  @ApiBody({
    type: UpdateFormDto,
    examples: {
      default: {
        summary: 'Sample update payload',
        value: {
          title: 'Updated Feedback Form',
          isActive: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully updated.',
  })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateFormDto: UpdateFormDto,
  ) {
    return this.formsService.updateForm(req.user.businessId, id, updateFormDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a specific form by ID' })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully deleted.',
  })
  remove(@Request() req, @Param('id') id: string) {
    return this.formsService.deleteForm(req.user.businessId, id);
  }

  @Get(':id/responses')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all responses for a specific form' })
  @ApiResponse({
    status: 200,
    description: 'Return all form responses.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-response-1234' },
          visitorId: { type: 'string', example: 'uuid-visitor-1234' },
          branchId: { type: 'string', example: 'uuid-branch-1234' },
          createdAt: { type: 'string', format: 'date-time' },
          answers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'uuid-answer-1234' },
                value: { type: 'string', example: '5' },
                field: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'uuid-field-1234' },
                    question: {
                      type: 'string',
                      example: 'How would you rate our service?',
                    },
                    type: { type: 'string', example: 'radio' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  findResponses(@Request() req, @Param('id') id: string) {
    return this.formsService.getFormResponses(req.user.businessId, id);
  }
}
