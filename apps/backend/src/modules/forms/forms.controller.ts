import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  BadRequestException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { UpdateBranchFormSettingsDto } from './dto/update-branch-form-settings.dto';
import { BranchIdParamDto } from './dto/branch-id-param.dto';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UserRole, User } from '../users/entities/user.entity';
import { BranchFilterDto } from '../../common/dto/branch-filter.dto';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Business Forms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('business-forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  private async getBranchId(
    user: User,
    queryBranchId?: string,
  ): Promise<string> {
    // For Owner and Admin: branchId MUST be provided in the request
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (!queryBranchId) {
        throw new BadRequestException(
          'branchId is required for Owners and Admins',
        );
      }

      if (user.role === UserRole.OWNER) {
        const hasAccess = await this.formsService.checkBranchAccess(
          user,
          queryBranchId,
        );
        if (!hasAccess) {
          throw new BadRequestException(
            'You do not have access to this branch',
          );
        }
      }
      return queryBranchId;
    }

    // For Manager and Staff: ignore provided branchId, always use branchId from token
    if (!user.branchId) {
      throw new BadRequestException('User is not associated with any branch');
    }

    return user.branchId;
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('engagement')
  @ApiOperation({ summary: 'Create a new form for the branch' })
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
        uniqueCode: { type: 'string', example: 'ABC123XYZ' },
        title: { type: 'string', example: 'Customer Feedback' },
        description: {
          type: 'string',
          example: 'Let us know how your visit went',
        },
        isActive: { type: 'boolean', example: true },
        isPublished: { type: 'boolean', example: true },
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
  async create(
    @Request() req: RequestWithUser,
    @Body() createFormDto: CreateFormDto,
  ) {
    const branchId = await this.getBranchId(req.user, createFormDto.branchId);
    return this.formsService.createForm(branchId, createFormDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('engagement')
  @ApiOperation({ summary: 'Get all forms for the branch' })
  @ApiResponse({
    status: 200,
    description: 'Return all forms array.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-form-1234' },
          uniqueCode: { type: 'string', example: 'ABC123XYZ' },
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
  async findAll(
    @Request() req: RequestWithUser,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = await this.getBranchId(req.user, filter.branchId);
    return this.formsService.getFormsByBranch(branchId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('engagement')
  @ApiOperation({ summary: 'Get a specific form by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the form with its fields.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-form-1234' },
        uniqueCode: { type: 'string', example: 'ABC123XYZ' },
        title: { type: 'string', example: 'Customer Feedback' },
        fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-field-1234' },
              type: { type: 'string', example: 'radio' },
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
  async findOne(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = await this.getBranchId(req.user, filter.branchId);
    return this.formsService.getFormById(branchId, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('engagement')
  @ApiOperation({ summary: 'Update a specific form by ID' })
  @ApiBody({
    type: UpdateFormDto,
    examples: {
      default: {
        summary: 'Sample update payload',
        value: {
          title: 'Updated Feedback Form',
          isActive: false,
          showAfterLeadCapture: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully updated.',
  })
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateFormDto: UpdateFormDto,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = await this.getBranchId(
      req.user,
      filter.branchId || updateFormDto.branchId,
    );
    return this.formsService.updateForm(branchId, id, updateFormDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('engagement')
  @ApiOperation({ summary: 'Delete a specific form by ID' })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully deleted.',
  })
  async remove(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = await this.getBranchId(req.user, filter.branchId);
    return this.formsService.deleteForm(branchId, id);
  }

  @Get(':id/responses')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('engagement')
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
  async findResponses(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = await this.getBranchId(req.user, filter.branchId);
    return this.formsService.getFormResponses(branchId, id);
  }

  @Patch('branch-settings/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('engagement')
  @ApiOperation({
    summary: 'Update branch-specific form settings (appearance, messages)',
  })
  @ApiResponse({
    status: 200,
    description: 'Branch settings have been successfully updated.',
  })
  async updateBranchSettings(
    @Request() req: RequestWithUser,
    @Param() params: BranchIdParamDto,
    @Body() dto: UpdateBranchFormSettingsDto,
  ) {
    const branchId = await this.getBranchId(req.user, params.branchId);
    return this.formsService.updateBranchSettings(branchId, dto);
  }
}
