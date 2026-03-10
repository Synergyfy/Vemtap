import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { SubmitFormResponseDto } from './dto/submit-form-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';
import { Public } from '../../common/decorators/public.decorator';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Visitor Forms')
@ApiBearerAuth()
@Controller('visitor-forms')
export class VisitorFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get('branch/:branchId')
  @Public()
  @ApiOperation({
    summary: 'Get all active forms for a specific branch',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all available forms.',
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
  findForms(@Param('branchId') branchId: string) {
    return this.formsService.getFormsForVisitor(branchId);
  }

  @Get('public/:id')
  @Public()
  @ApiOperation({ summary: 'Get a public form by ID (no auth required)' })
  @ApiResponse({
    status: 200,
    description: 'Return the public form with fields to answer.',
  })
  findPublic(@Param('id') id: string) {
    return this.formsService.getPublicFormById(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific form with its questions' })
  @ApiQuery({ name: 'branchId', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the form with fields to answer.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-form-1234' },
        title: { type: 'string', example: 'Customer Feedback' },
        description: {
          type: 'string',
          example: 'Let us know how your visit went',
        },
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
  findOne(@Param('id') id: string, @Query('branchId') branchId: string) {
    if (!branchId) throw new BadRequestException('branchId is required');
    return this.formsService.getFormByIdForVisitor(id, branchId);
  }

  @Post(':id/responses')
  @ApiOperation({ summary: 'Submit answers for a specific form' })
  @ApiBody({
    type: SubmitFormResponseDto,
    examples: {
      default: {
        summary: 'Sample response payload',
        value: {
          branchId: 'uuid-branch-1234',
          answers: [
            {
              fieldId: 'uuid-field-1234',
              value: '5',
            },
            {
              fieldId: 'uuid-field-5678',
              value: 'It was a great visit.',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Form response successfully submitted.',
  })
  submitResponse(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() submitResponseDto: SubmitFormResponseDto,
  ) {
    const visitorId = req.user.id;
    return this.formsService.submitResponse(id, visitorId, submitResponseDto);
  }
}
